"use client";

import { motion } from "framer-motion";
import { Clock, ChevronRight, Layers } from "lucide-react";

type Props = {
  count: number;
  onClick: () => void;
};

/**
 * A "bundled cards" visual that replaces individual stale applying cards in the
 * Card List. Clicking navigates to /dashboard/jobs/stale-applying.
 * Sized and styled to match JobCard for visual consistency.
 */
export default function StackedApplyingCard({ count, onClick }: Props) {
  return (
    /* pb-2 reveals the two back layers below the main card */
    <div className="relative mb-3 pb-2">
      {/* Back layer 2 — deepest, most inset */}
      <div className="absolute inset-x-3 top-2 h-full rounded-xl border border-gray-300/60 bg-white/60 shadow-sm dark:border-slate-600/40 dark:bg-slate-700/35" />
      {/* Back layer 1 */}
      <div className="absolute inset-x-1.5 top-1 h-full rounded-xl border border-gray-300/80 bg-white/80 shadow-sm dark:border-slate-600/60 dark:bg-slate-700/55" />

      {/* Main card — matches JobCard visual language */}
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{
          y: -2,
          boxShadow: "0 8px 24px -4px rgba(99,102,241,0.18)",
        }}
        whileTap={{ scale: 0.975 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="relative w-full overflow-hidden rounded-xl border border-gray-400 bg-white text-left shadow-md transition-all duration-200 ease-out hover:border-indigo-500 hover:bg-indigo-50/60 hover:ring-2 hover:ring-indigo-200/90 dark:border-slate-700 dark:bg-slate-600 dark:hover:border-yellow-500/70 dark:hover:bg-slate-500 dark:hover:ring-yellow-400/35"
      >
        {/* Left color bar — amber to signal "attention needed" */}
        <div className="absolute left-0 top-0 z-[1] h-full w-2 bg-amber-400 dark:bg-amber-500 sm:w-3" />

        <div className="flex flex-1 flex-col gap-2.5 py-2 pl-6 pr-4 sm:pl-7">
          {/* Title row */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex-1 text-xl font-semibold leading-snug text-gray-800 dark:text-gray-100">
              {count} Old Applying Card{count === 1 ? "" : "s"}
            </h3>
            <ChevronRight
              size={18}
              className="shrink-0 text-gray-400 dark:text-gray-400"
              aria-hidden
            />
          </div>

          {/* Company-equivalent row */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-200">
            <Clock size={14} className="shrink-0" aria-hidden />
            Stuck in Applying for 7+ days
          </div>

          {/* Badge + hint row */}
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-700/40 dark:text-amber-200">
              <Layers size={11} aria-hidden />
              STALE
            </span>
            <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
              Tap to review and move forward
            </p>
          </div>
        </div>
      </motion.button>
    </div>
  );
}
