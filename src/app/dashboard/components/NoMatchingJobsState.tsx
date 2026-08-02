"use client";

import { SearchX } from "lucide-react";

type Props = {
  /** Current search box value — echoed back so the user sees what was matched against. */
  searchTerm: string;
  /** True when a status filter other than "all" is active. */
  hasStatusFilter: boolean;
  onClear: () => void;
};

/**
 * Shown when the user has jobs but the active search / status filter matches none.
 * Distinct from EmptyPipelineState so an existing user is never told to add a first job.
 */
export default function NoMatchingJobsState({
  searchTerm,
  hasStatusFilter,
  onClear,
}: Props) {
  const trimmed = searchTerm.trim();

  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-6 text-center dark:border-slate-600 dark:bg-slate-800/40">
      <SearchX
        size={24}
        className="mx-auto text-gray-400 dark:text-slate-500"
        aria-hidden
      />
      <p className="mt-3 text-base font-semibold text-gray-700 dark:text-gray-200">
        No cards match this view.
      </p>
      <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {trimmed
          ? `Nothing found for “${trimmed}”.`
          : "This stage has no cards right now."}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-yellow-400 dark:focus-visible:ring-offset-slate-800"
      >
        {trimmed && hasStatusFilter
          ? "Clear search and filter"
          : trimmed
            ? "Clear search"
            : "Show all cards"}
      </button>
    </div>
  );
}
