"use client";

import { motion } from "framer-motion";
import { ChevronRight, FolderOpen } from "lucide-react";

type Props = {
  count: number;
  onClick: () => void;
};

/**
 * Folder-tab design: a protruding tab (count + "CARDS") sits above the folder
 * body. Clicking navigates to /dashboard/jobs/stale-applying.
 */
export default function StackedApplyingCard({ count, onClick }: Props) {
  return (
    <div className="mb-4 mt-1">
      {/* Folder tab — amber, rounded top only, no bottom border */}
      <div className="inline-flex h-7 items-center gap-1.5 rounded-t-lg border border-b-0 border-amber-400 bg-amber-400 px-3 dark:border-amber-500 dark:bg-amber-500">
        <FolderOpen size={12} className="shrink-0 text-amber-900 dark:text-amber-950" aria-hidden />
        <span className="text-xs font-bold tracking-wide text-amber-950">
          {count} CARDS
        </span>
      </div>

      {/* Folder body — -mt-px closes the 1px seam between tab bottom and body top */}
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -1, boxShadow: "0 6px 20px -4px rgba(245,158,11,0.28)" }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="block w-full -mt-px rounded-xl rounded-tl-none border border-amber-400 bg-amber-50 px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-amber-100/80 dark:border-amber-500/60 dark:bg-amber-950/25 dark:hover:bg-amber-950/40"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Stuck in Applying · 7+ days
          </span>
          <ChevronRight size={16} className="shrink-0 text-amber-500 dark:text-amber-400" aria-hidden />
        </div>
      </motion.button>
    </div>
  );
}
