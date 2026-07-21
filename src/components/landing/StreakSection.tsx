"use client";

import { useEffect, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Flame, Check } from "lucide-react";
import Reveal from "./Reveal";

// Illustrative week for the streak ring. States mirror the app's WeekCircle:
// done / current (today, highlighted) / pending (not yet).
type DayState = "done" | "current" | "pending";
const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

const XP_MAX = 200;

// Looping momentum demo: the streak grows a day at a time and the XP bar climbs
// with it, then resets to the opening state and repeats. `current` is the
// highlighted (today) circle; every earlier day reads as done, every later one
// as pending. Values match the app's Level 2 / 200-XP band.
type Stage = { streak: number; current: number; xp: number };
const STAGES: Stage[] = [
  { streak: 4, current: 3, xp: 120 }, // opening state — Thu is today
  { streak: 5, current: 4, xp: 150 }, // + Friday
  { streak: 6, current: 5, xp: 180 }, // + Saturday
];

const STAGE_MS = 2000; // dwell per stage, long enough to read the climb
const FILL_DURATION = 0.9;

function dayState(index: number, current: number): DayState {
  if (index < current) return "done";
  if (index === current) return "current";
  return "pending";
}

/** Faithful copy of DashboardStreakPanel's WeekCircle (dashboard is the source of truth). */
function WeekCircle({ state }: { state: DayState }) {
  const isFilled = state === "done" || state === "current";
  const isCurrent = state === "current";
  return (
    <div
      className={[
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-500 sm:h-10 sm:w-10",
        isFilled
          ? "border-2 border-[#f59e0b] bg-[#ffeb3b] shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
          : "border-2 border-dashed border-white/90 bg-white/10",
        isCurrent
          ? "ring-2 ring-white/70 ring-offset-2 ring-offset-transparent shadow-[0_0_16px_rgba(255,255,255,0.45)]"
          : "",
      ].join(" ")}
      aria-hidden="true"
    >
      {/* Check pops in when the day fills, so the streak visibly advances. */}
      <motion.span
        initial={false}
        animate={{ scale: isFilled ? 1 : 0, opacity: isFilled ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Check className="h-4 w-4 stroke-[3] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]" />
      </motion.span>
    </div>
  );
}

export default function StreakSection() {
  const reduceMotion = useReducedMotion();
  const [stageIndex, setStageIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const stage = STAGES[stageIndex];

  // XP animates through a motion value so the bar fills smoothly rather than
  // snapping between stages; the numeric readout is derived from the same value.
  const xp = useMotionValue(STAGES[0].xp);
  const xpRounded = useTransform(xp, (v) => Math.round(v));
  const barWidth = useTransform(xp, (v) => `${(v / XP_MAX) * 100}%`);
  const toNext = useTransform(xp, (v) => `${Math.round(XP_MAX - v)} XP to next level`);

  // Auto-advance, paused while the visitor is reading (hover/focus) or when the
  // OS asks for reduced motion (then it holds on the opening state).
  useEffect(() => {
    if (reduceMotion || paused) return;
    const id = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length);
    }, STAGE_MS);
    return () => clearInterval(id);
  }, [reduceMotion, paused]);

  useEffect(() => {
    const controls = animate(xp, STAGES[stageIndex].xp, {
      duration: reduceMotion ? 0 : FILL_DURATION,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [stageIndex, reduceMotion, xp]);

  const xpPct = Math.round((stage.xp / XP_MAX) * 100);

  return (
    <section className="border-t border-line bg-canvas">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-8 md:grid-cols-2 md:gap-16">
        {/* Preview first on desktop, second on mobile */}
        <Reveal delay={0.1} className="order-2 md:order-1">
          {/* Faithful replica of the in-app dashboard header card
              (see src/app/dashboard/Client.tsx + DashboardStreakPanel + XpSummaryCard):
              same fuchsia→violet→indigo gradient, streak ring, and XP bar — here
              looping through a few days of progress. Focusable so keyboard users
              can pause it. */}
          <div
            role="group"
            aria-label="Momentum preview — a streak and XP bar climbing over a few days"
            tabIndex={0}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-600 to-indigo-700 p-5 shadow-[0_10px_28px_-6px_rgba(109,40,217,0.55),0_0_0_1px_rgba(255,255,255,0.2)_inset,0_-1px_0_0_rgba(0,0,0,0.15)_inset] ring-2 ring-cyan-200/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal dark:from-fuchsia-600 dark:via-violet-600 dark:to-sky-800 dark:shadow-[0_12px_32px_-8px_rgba(76,29,149,0.65),0_0_0_1px_rgba(255,255,255,0.12)_inset] dark:ring-cyan-400/30 sm:p-6"
          >
            {/* Decorative glows (aria-hidden), matching the app header. */}
            <span
              className="pointer-events-none absolute -left-1/4 top-0 h-[200%] w-2/3 -rotate-12 bg-gradient-to-r from-white/25 via-white/5 to-transparent dark:from-white/18"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -bottom-20 right-0 h-44 w-44 rounded-full bg-cyan-400/35 blur-3xl dark:bg-sky-400/22"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -right-10 -top-20 h-40 w-40 rounded-full bg-fuchsia-400/40 blur-3xl dark:bg-fuchsia-500/28"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/65 to-transparent dark:via-white/38"
              aria-hidden
            />

            <div className="relative z-[1]">
              <h3 className="mb-3 text-xl font-bold text-white drop-shadow-sm sm:text-2xl">
                Welcome, <span className="text-yellow-300 dark:text-yellow-200">Demo</span>
              </h3>

              {/* Streak */}
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 text-base font-bold tabular-nums text-white drop-shadow-sm sm:text-lg">
                  <Flame
                    size={24}
                    className="shrink-0 drop-shadow-sm"
                    fill="#ef4444"
                    stroke="#fde68a"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>{stage.streak}-day streak</span>
                </p>
                <div
                  className="flex max-w-md justify-between gap-1 sm:gap-2"
                  role="list"
                  aria-label="This week daily login progress"
                >
                  {WEEK_LETTERS.map((letter, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5" role="listitem">
                      <span className="text-[0.65rem] font-medium uppercase tracking-wide text-white/85 sm:text-xs">
                        {letter}
                      </span>
                      <WeekCircle state={dayState(i, stage.current)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* XP progress (mirrors XpSummaryCard inline) */}
              <div className="mt-6">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-base font-semibold text-white">Level 2</span>
                  <span className="font-mono text-xs text-white/90">
                    <motion.span>{xpRounded}</motion.span> / {XP_MAX} XP
                  </span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-full border border-slate-50 bg-gray-200 dark:bg-slate-600"
                  role="progressbar"
                  aria-valuenow={xpPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Level 2 progress: ${xpPct}%`}
                >
                  <motion.div
                    className="h-full rounded-full bg-yellow-500"
                    style={{ width: barWidth }}
                  />
                </div>
                <motion.p className="mt-1 text-right text-xs text-white/90">{toNext}</motion.p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="order-1 md:order-2">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-streak">
            03 / Momentum
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            Stay in the game
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
            Searching for a job is a marathon. Daily missions, an interview drill, and a streak that
            grows each day you show up turn the grind into steady progress — and XP you can watch
            climb.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
