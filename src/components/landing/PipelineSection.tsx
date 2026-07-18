"use client";

import { useState } from "react";
import { getAdvanceButtonLabel, statusDisplayLabel } from "@/lib/jobPipeline";
import Reveal from "./Reveal";

// Real pipeline order (from src/lib/jobPipeline.ts getNextStage chain).
const STAGES = ["applying", "resume", "interview1", "interview2", "interview3", "offer"] as const;

// Friendly display for the interview steps; other labels come straight from the lib.
function displayLabel(status: string): string {
  if (status === "interview1") return "INTERVIEW 1";
  if (status === "interview2") return "INTERVIEW 2";
  if (status === "interview3") return "INTERVIEW 3";
  return statusDisplayLabel(status);
}

export default function PipelineSection() {
  const [active, setActive] = useState(1); // default highlight on APPLIED

  const activeStatus = STAGES[active];
  const advanceLabel = getAdvanceButtonLabel(activeStatus);

  return (
    <section id="features" className="scroll-mt-20 border-t border-line bg-canvas-alt">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-8 md:grid-cols-2 md:gap-16">
        <Reveal>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-signal">
            01 / The rail
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            One checkpoint at a time
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
            Applications don&rsquo;t jump around. Each one advances a single step along a guided
            track — apply, hear back, interview, offer. You always know where every role stands and
            what the next move is.
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink-muted">
            Tap a checkpoint to see what the pipeline allows from there.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <ol className="relative">
              {STAGES.map((status, i) => {
                const isActive = i === active;
                const isDone = i < active;
                const isOffer = status === "offer";
                return (
                  <li key={status} className="relative flex items-center gap-4 pb-6 last:pb-0">
                    {/* connector */}
                    {i < STAGES.length - 1 && (
                      <span
                        className={`absolute left-[7px] top-5 h-[calc(100%-4px)] w-[2px] ${
                          isDone ? "bg-signal" : "bg-line"
                        }`}
                        aria-hidden="true"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      className="group flex w-full items-center gap-4 rounded-lg py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                      aria-pressed={isActive}
                    >
                      <span
                        className={`relative z-10 h-4 w-4 shrink-0 rounded-full ring-4 ring-surface transition-transform group-hover:scale-110 ${
                          isOffer && (isActive || isDone)
                            ? "bg-hired"
                            : isActive || isDone
                              ? "bg-signal"
                              : "bg-line"
                        } ${isActive ? "scale-110" : ""}`}
                      />
                      <span
                        className={`font-mono text-sm tracking-wide transition-colors ${
                          isActive ? "text-ink" : "text-ink-muted"
                        }`}
                      >
                        {displayLabel(status)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-2 rounded-lg bg-canvas px-4 py-3">
              <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">Next move</p>
              <p className="mt-1 text-sm font-medium text-ink">
                {advanceLabel ?? "This is a final outcome — the track is complete."}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
