"use client";

const PLACEHOLDER_COUNT = 3;

/**
 * Loading placeholder for the Card List.
 * Mirrors JobCard's anatomy (headline, meta line, five-node rail, next-checkpoint
 * row) so the list does not shift when real cards arrive.
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
          className="flex animate-pulse flex-col gap-4 rounded-xl border border-line bg-surface p-4 shadow-sm motion-reduce:animate-none"
        >
          <div className="flex flex-col gap-2">
            <div className="h-5 w-1/2 rounded bg-canvas-alt" />
            <div className="h-4 w-1/3 rounded bg-canvas-alt" />
          </div>
          <div className="flex items-center gap-2 py-1.5">
            {Array.from({ length: 5 }).map((__, n) => (
              <span key={n} className="flex flex-1 items-center gap-2 last:flex-none">
                <span className="size-3 shrink-0 rounded-full bg-canvas-alt" />
                {n < 4 && <span className="h-[2px] flex-1 bg-canvas-alt" />}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded bg-canvas-alt" />
            <div className="h-10 w-40 rounded-xl bg-canvas-alt" />
          </div>
        </div>
      ))}
    </div>
  );
}
