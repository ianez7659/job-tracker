"use client";

import { motion, useReducedMotion } from "framer-motion";

// Checkpoint labels are the product's real pipeline stages, in display form.
// Verified against src/lib/jobPipeline.ts: statusDisplayLabel maps resume -> "APPLIED",
// transitions run applying -> resume -> interview1/2/3 -> offer/rejected.
const NODES = [
  { label: "APPLYING", tone: "signal" as const },
  { label: "APPLIED", tone: "signal" as const },
  { label: "INTERVIEW", tone: "signal" as const },
  { label: "OFFER", tone: "hired" as const },
];

// Node centers sit at the middle of each of the 4 equal columns.
const FIRST_CENTER = 12.5;
const LAST_CENTER = 87.5;

export default function GuidedRail() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative w-full" aria-hidden="true">
      {/* Track (background line) between first and last checkpoint centers */}
      <div
        className="absolute top-2 h-[2px] -translate-y-1/2 rounded-full bg-line"
        style={{ left: `${FIRST_CENTER}%`, right: `${100 - LAST_CENTER}%` }}
      />

      {/* Progress line draws in from the first checkpoint */}
      <motion.div
        className="absolute top-2 h-[2px] origin-left -translate-y-1/2 rounded-full"
        style={{
          left: `${FIRST_CENTER}%`,
          right: `${100 - LAST_CENTER}%`,
          background: "linear-gradient(90deg, var(--signal), var(--hired))",
        }}
        initial={{ scaleX: reduceMotion ? 1 : 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.65, 0, 0.35, 1] }}
      />

      {/* Traveling token — one pass, then rests at OFFER */}
      <motion.div
        className="token-pulse absolute top-2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal ring-2 ring-canvas"
        initial={{ left: `${reduceMotion ? LAST_CENTER : FIRST_CENTER}%`, opacity: reduceMotion ? 1 : 0 }}
        animate={{ left: `${LAST_CENTER}%`, opacity: 1 }}
        transition={{
          left: { duration: reduceMotion ? 0 : 1.4, delay: reduceMotion ? 0 : 0.9, ease: [0.5, 0, 0.2, 1] },
          opacity: { duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.9 },
        }}
      />

      {/* Checkpoint nodes + labels */}
      <div className="grid grid-cols-4">
        {NODES.map((node, i) => (
          <div key={node.label} className="flex flex-col items-center gap-3">
            <motion.span
              className={`block h-4 w-4 rounded-full ring-2 ring-canvas ${
                node.tone === "hired" ? "bg-hired" : "bg-signal"
              }`}
              initial={{ scale: reduceMotion ? 1 : 0, opacity: reduceMotion ? 1 : 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: reduceMotion ? 0 : 0.45,
                delay: reduceMotion ? 0 : 0.3 + i * 0.22,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            />
            <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-muted sm:text-xs">
              {node.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
