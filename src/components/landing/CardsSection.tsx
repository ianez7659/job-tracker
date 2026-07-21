"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Building2, Calendar, Link2, X } from "lucide-react";
import { getAdvanceButtonLabel, statusDisplayLabel } from "@/lib/jobPipeline";
import { statusColorClass } from "@/lib/jobStatusColors";
import Reveal from "./Reveal";

const BENEFITS = [
  "See every application in one place",
  "Know exactly what stage each job is in",
  "Advance to the next step in one tap",
  "Never lose track of a follow-up",
] as const;

// Named parts of the card, shown as a legend beneath it so the card itself
// stays a pixel-faithful replica of the in-app JobCard.
const ANATOMY = ["Company & role", "Applied date", "Current stage", "Next step"] as const;

// The funnel the demo loops through. Mirrors getNextStage() in src/lib/jobPipeline.ts
// (resume → interview1 → interview2 → interview3); the loop wraps back to the
// start rather than branching to the offer/rejected terminals.
const STAGES = ["resume", "interview1", "interview2", "interview3"] as const;
type StageKey = (typeof STAGES)[number];

// JobCard renders "Next: {getAdvanceButtonLabel(status)}", falling back to this
// line for interview3, which has no single-step successor.
function nextStepCopy(stage: StageKey): string {
  const label = getAdvanceButtonLabel(stage);
  return label ? `Next: ${label}` : "Next: mark Offer or Rejected on the detail page.";
}

const AUTO_ADVANCE_MS = 2800;

export default function CardsSection() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Once the visitor picks a stage the carousel stops competing with them.
  const [userControlled, setUserControlled] = useState(false);
  const [paused, setPaused] = useState(false);

  const stage = STAGES[index];

  const advance = useCallback(() => {
    setUserControlled(true);
    setIndex((i) => (i + 1) % STAGES.length);
  }, []);

  const selectStage = useCallback((i: number) => {
    setUserControlled(true);
    setIndex(i);
  }, []);

  useEffect(() => {
    // No auto-motion when the visitor has taken over, is inspecting the card
    // (hover/focus), or has asked the OS for reduced motion.
    if (reduceMotion || userControlled || paused) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % STAGES.length),
      AUTO_ADVANCE_MS,
    );
    return () => clearInterval(timer);
  }, [reduceMotion, userControlled, paused]);

  return (
    <section id="features" className="scroll-mt-20 border-t border-line bg-canvas-alt">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-8 md:grid-cols-2 md:gap-16">
        {/* Copy + checklist */}
        <Reveal>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-signal">
            01 / Tracking
          </p>
          <h2 className="mt-4 max-w-md font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            Every job is a card you can read at a glance
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
            Company, role, date, current stage, and your next move — all on one card. No spreadsheet
            gymnastics, no digging through tabs.
          </p>
          <ul className="mt-8 space-y-3">
            {BENEFITS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-ink">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal/12 text-signal">
                  <Check size={13} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Replica of the in-app JobCard (see src/components/JobCard.tsx), cycling
            through the pipeline stages. Auto-advances until the visitor interacts,
            then hands over control. The app card's router/delete behavior is omitted. */}
        <Reveal delay={0.1}>
          <div className="mx-auto w-full max-w-sm">
            <div
              role="button"
              tabIndex={0}
              aria-label={`Job card, stage ${statusDisplayLabel(stage)}. Activate to show the next stage.`}
              onClick={advance}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  advance();
                }
              }}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              className="relative flex cursor-pointer overflow-hidden rounded-xl border border-gray-400 bg-white shadow-md transition-shadow hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal dark:border-slate-700 dark:bg-slate-600"
            >
              {/* Left status stripe — color tracks the current stage */}
              <div
                className={`absolute left-0 top-0 z-[1] h-full w-2 transition-colors duration-500 sm:w-3 ${statusColorClass(stage)}`}
              />
              <div className="flex flex-1 flex-col gap-3 px-6 py-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="min-w-0 flex-1 font-display text-xl font-semibold leading-snug text-gray-800 dark:text-gray-100">
                      Frontend Developer
                    </h3>
                    <span
                      aria-hidden="true"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-500 dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-400"
                    >
                      <X size={18} strokeWidth={2} />
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-200">
                    <Building2 size={14} /> Northwind Studio
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-200">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> 7/18/2026
                  </span>
                  <span className="flex items-center gap-1 text-blue-600 dark:text-yellow-400">
                    <Link2 size={14} /> Link to original posting
                  </span>
                </div>

                {/* Fixed min-height keeps the card from reflowing as the
                    next-step copy changes length between stages. */}
                <div className="mt-2 flex min-h-[4.75rem] flex-col gap-1.5">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={stage}
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                      transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="flex flex-col gap-1.5"
                    >
                      <span
                        className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${statusColorClass(stage)}`}
                      >
                        {statusDisplayLabel(stage)}
                      </span>
                      <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                        Advance stages from the job detail page
                        <span className="mt-0.5 block text-gray-600 dark:text-gray-300">
                          {nextStepCopy(stage)}
                        </span>
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Stage selector — also the visible control that stops the auto-loop */}
            <div
              className="mt-5 flex items-center justify-center gap-2"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {STAGES.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => selectStage(i)}
                  onFocus={() => setPaused(true)}
                  onBlur={() => setPaused(false)}
                  aria-label={`Show ${statusDisplayLabel(s)} stage`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal ${
                    i === index ? "w-7 bg-signal" : "w-3 bg-line hover:bg-ink-muted/50"
                  }`}
                />
              ))}
            </div>

            {/* Anatomy legend — names each part without distorting the card */}
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5">
              {ANATOMY.map((part) => (
                <li key={part} className="flex items-center gap-2 text-xs text-ink-muted">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal" aria-hidden="true" />
                  {part}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
