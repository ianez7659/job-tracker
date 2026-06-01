"use client";

import { motion } from "framer-motion";
import { ChevronRight, FolderOpen } from "lucide-react";

type Props = {
  count: number;
  onClick: () => void;
};

export default function StackedApplyingCard({ count, onClick }: Props) {
  return (
    <motion.div
      className="mb-4 mt-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.35, 1] }}
    >
      {/* Folder tab — 40% wide, APPLYING label, gradient fades into body bg */}
      <div className="inline-flex h-8 w-2/5 items-center justify-center rounded-t-lg border border-b-0 border-amber-400 bg-gradient-to-b from-amber-200 to-amber-50 dark:border-amber-500/60 dark:from-amber-700/50 dark:to-amber-950/25">
        <span className="text-sm tracking-wide text-amber-700 dark:text-amber-300">
          Applying
        </span>
      </div>

      {/* Folder body */}
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{
          y: 0,
          boxShadow: "0 8px 24px -4px rgba(245,158,11,0.3)",
        }}
        whileTap={{
          scale: 1.02,
          boxShadow: "0 12px 32px -6px rgba(245,158,11,0.4)",
        }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="flex min-h-[11rem] w-full -mt-px flex-col rounded-xl rounded-tl-none border border-amber-400 bg-amber-50 px-8 sm:px-12 py-4 text-left shadow-sm transition-colors hover:from-amber-300/70 hover:via-amber-100/80 hover:to-amber-50 dark:border-amber-500/60 dark:from-amber-600/30 dark:via-amber-900/20 dark:to-amber-950/25 dark:hover:from-amber-600/45 dark:hover:to-amber-950/40"
      >
        {/* Hero — flex-1 fills all space above the divider, content centered */}
        <div className="flex flex-1 items-center justify-center gap-3">
          {/* <span className="text-6xl font-black leading-none tracking-tight text-amber-500 dark:text-amber-400">
            {count}
          </span> */}
          <FolderOpen
            size={64}
            className="shrink-0 text-amber-200 dark:text-amber-400"
            aria-hidden
          />
          <div className="mb-1 flex flex-col leading-snug">
            <span className="text-lg sm:text-xl  font-bold text-amber-900 dark:text-amber-100">
              +7 Days Cards Stuck
            </span>
            {/* <span className="text-base font-bold text-amber-900 dark:text-amber-100">
              Stuck in Applying
            </span> */}
          </div>
        </div>

        {/* Divider — same color as border */}
        <div className="border-t border-amber-400 dark:border-amber-500/60" />

        {/* Footer: sub-label + arrow */}
        <div className="flex items-center justify-end gap-2 pt-2.5">
          <span className="text-base font-medium text-amber-700 dark:text-amber-300">
            Total {count} cards
          </span>
          <ChevronRight
            size={16}
            className="shrink-0 text-amber-500 dark:text-amber-400"
            aria-hidden
          />
        </div>
      </motion.button>
    </motion.div>
  );
}
