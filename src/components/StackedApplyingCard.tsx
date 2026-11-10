"use client";

import { motion } from "framer-motion";
import { ChevronRight, FolderOpen } from "lucide-react";

type Props = {
  count: number;
  onClick: () => void;
};

/**
 * Folder that stacks Applying cards untouched for 7+ days. Neutral on purpose:
 * it is a to-do, not a reward (Streak) or an outcome (Hired) — the only accent
 * is the Signal "Review" action.
 */
export default function StackedApplyingCard({ count, onClick }: Props) {
  const noun = count === 1 ? "card" : "cards";

  return (
    <motion.div
      className="mb-4 mt-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.35, 1] }}
    >
      {/* Folder tab */}
      <div className="inline-flex h-8 w-2/5 items-center justify-center rounded-t-lg border border-b-0 border-line bg-canvas-alt">
        <span className="text-sm tracking-wide text-ink-muted">Applying</span>
      </div>

      {/* Folder body */}
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{
          y: 0,
          boxShadow: "0 8px 24px -4px rgba(20,26,36,0.18)",
        }}
        whileTap={{
          scale: 1.02,
          boxShadow: "0 12px 32px -6px rgba(20,26,36,0.24)",
        }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="flex min-h-[11rem] w-full -mt-px flex-col rounded-xl rounded-tl-none border border-line bg-surface px-8 py-4 text-left shadow-sm transition-colors hover:border-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 sm:px-12"
      >
        <div className="flex flex-1 items-center justify-center gap-3">
          <FolderOpen size={56} className="shrink-0 text-ink-muted" aria-hidden />
          <span className="text-lg font-bold leading-snug text-ink sm:text-xl">
            <span className="font-mono tabular-nums">{count}</span> {noun} waiting 7+ days
          </span>
        </div>

        <div className="border-t border-line" />

        <div className="flex items-center justify-end gap-1.5 pt-2.5 text-base font-semibold text-signal">
          Review
          <ChevronRight size={18} className="shrink-0" aria-hidden />
        </div>
      </motion.button>
    </motion.div>
  );
}
