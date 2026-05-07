"use client";

import { Briefcase, ExternalLink } from "lucide-react";

type Props = {
  onFindJobs: () => void;
  /** Placeholder — wire to XP / level later */
  primaryLine?: string;
  secondaryLine?: string;
};

export default function FindJobsCtaCard({
  onFindJobs,
  primaryLine = "Keep building momentum — your progress updates here soon.",
  secondaryLine = "Find roles that match your profile.",
}: Props) {
  return (
    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50 p-5 shadow-sm dark:border-emerald-800/80 dark:bg-emerald-900/50 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
          <Briefcase className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 sm:text-xl">
            Ready to find jobs?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {primaryLine}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {secondaryLine}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onFindJobs}
        className="flex w-full items-stretch overflow-hidden rounded-lg bg-emerald-600 text-left font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600"
      >
        <span className="flex flex-1 items-center px-4 py-3 text-sm sm:text-base">
          Find jobs
        </span>
        <span
          className="flex items-center justify-center border-l border-emerald-500/40 px-4 py-3 dark:border-emerald-600/50"
          aria-hidden
        >
          <ExternalLink className="h-5 w-5 shrink-0 opacity-95" />
        </span>
      </button>
    </div>
  );
}
