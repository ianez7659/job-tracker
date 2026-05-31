"use client";

import { motion } from "framer-motion";
import { Clock, ChevronRight } from "lucide-react";

type Props = {
  count: number;
  onClick: () => void;
};

/**
 * A "bundled cards" visual that replaces individual stale applying cards in the
 * Card List. Clicking navigates to /dashboard/jobs/stale-applying.
 */
export default function StackedApplyingCard({ count, onClick }: Props) {
  return (
    /* Extra bottom padding to show the two back layers without clipping */
    <div className="relative mb-4 pb-3">
      {/* Back layer 2 — deepest */}
      <div className="absolute left-4 right-4 top-3 h-full rounded-xl border border-indigo-200/60 bg-indigo-100/50 dark:border-indigo-700/30 dark:bg-indigo-900/25" />
      {/* Back layer 1 */}
      <div className="absolute left-2 right-2 top-1.5 h-full rounded-xl border border-indigo-200/80 bg-indigo-100/75 dark:border-indigo-700/45 dark:bg-indigo-900/40" />

      {/* Main card */}
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(99,102,241,0.25)" }}
        whileTap={{ scale: 0.975 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="relative w-full cursor-pointer rounded-xl border border-indigo-300 bg-gradient-to-br from-indigo-50 to-indigo-100/60 px-4 py-3.5 text-left shadow-md dark:border-indigo-600/70 dark:from-indigo-950/80 dark:to-indigo-900/50"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 shadow-sm dark:bg-indigo-900/60">
              <Clock size={17} className="text-indigo-600 dark:text-indigo-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                {count} Old Applying Card{count === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400">
                Stuck in Applying 7+ days · Tap to review
              </p>
            </div>
          </div>
          <ChevronRight
            size={17}
            className="shrink-0 text-indigo-400 dark:text-indigo-500"
            aria-hidden
          />
        </div>
      </motion.button>
    </div>
  );
}
