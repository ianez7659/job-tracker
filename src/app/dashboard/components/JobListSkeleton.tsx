"use client";

const PLACEHOLDER_COUNT = 3;

/**
 * Loading placeholder for the Card List.
 * Mirrors JobCard's outline (rounded-xl, left status stripe) so the list does
 * not shift when real cards arrive.
 */
export default function JobListSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="grid grid-cols-1 gap-4"
    >
      <span className="sr-only">Loading your job applications…</span>
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          className="relative animate-pulse overflow-hidden rounded-xl border border-gray-300 bg-white p-4 pl-8 shadow-sm dark:border-slate-700 dark:bg-slate-600/50"
        >
          <span className="absolute left-0 top-0 h-full w-2 bg-gray-200 dark:bg-slate-500 sm:w-3" />
          <div className="h-5 w-1/2 rounded bg-gray-200 dark:bg-slate-500" />
          <div className="mt-2.5 h-3.5 w-1/3 rounded bg-gray-200 dark:bg-slate-500" />
          <div className="mt-5 h-5 w-20 rounded-full bg-gray-200 dark:bg-slate-500" />
        </div>
      ))}
    </div>
  );
}
