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
 * Body maintains ~6:4 (w:h) folder proportion.
 */
export default function StackedApplyingCard({ count, onClick }: Props) {
  return (
    <div className="mb-4 mt-1">
      {/* Folder tab — amber, rounded top only, no bottom border */}
      <div className="inline-flex h-8 items-center gap-1.5 rounded-t-lg border border-b-0 border-amber-400 bg-amber-400 px-3.5 dark:border-amber-500 dark:bg-amber-500">
        <FolderOpen size={13} className="shrink-0 text-amber-900 dark:text-amber-950" aria-hidden />
        <span className="text-xs font-bold tracking-wide text-amber-950">
          {count} CARDS
        </span>
      </div>

      {/* Folder body — min-h gives ~6:4 folder proportion, flex centers content */}
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(245,158,11,0.3)" }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="flex min-h-[11rem] w-full -mt-px items-center justify-between rounded-xl rounded-tl-none border border-amber-400 bg-amber-50 px-5 text-left shadow-sm transition-colors hover:bg-amber-100/80 dark:border-amber-500/60 dark:bg-amber-950/25 dark:hover:bg-amber-950/40"
      >
        <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
          Stuck in Applying · 7+ days
        </span>
        <ChevronRight size={18} className="shrink-0 text-amber-500 dark:text-amber-400" aria-hidden />
      </motion.button>
    </div>
  );
}
