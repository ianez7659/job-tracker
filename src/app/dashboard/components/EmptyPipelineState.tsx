"use client";

import { FileInput, MessageSquare, Plus, Send } from "lucide-react";

type Props = {
  /** Opens the add-job flow — same handler the header "Add New" button uses. */
  onAddFirstJob: () => void;
};

/**
 * Stages previewed below the primary action.
 *
 * Offer and Rejected are deliberately absent: the Card List filters out final
 * statuses (see `isFinal` in dashboard/lib/jobs/metrics.ts, and the status
 * exclusion in GET /api/jobs), so a slot for them could never fill.
 *
 * Labels mirror ProgressSection; the accent stripes mirror STATUS_COLORS.
 */
const GHOST_STAGES = [
  {
    label: "Applied",
    hint: "Submitted — waiting to hear back",
    Icon: Send,
    stripe: "bg-emerald-300 dark:bg-emerald-600",
  },
  {
    label: "Interviews",
    hint: "Rounds 1 · 2 · 3",
    Icon: MessageSquare,
    stripe: "bg-amber-300 dark:bg-amber-500",
  },
] as const;

function Connector() {
  return (
    <span
      aria-hidden
      className="ml-6 block h-4 w-px bg-gray-300 dark:bg-slate-600 sm:ml-7"
    />
  );
}

/**
 * Shown in the Card List when the user has no active jobs at all.
 * The first slot is the real call to action; the rest preview where cards go next.
 */
export default function EmptyPipelineState({ onAddFirstJob }: Props) {
  return (
    <section aria-labelledby="empty-pipeline-heading" className="py-1">
      <h3
        id="empty-pipeline-heading"
        className="font-display text-xl font-bold text-gray-800 dark:text-gray-100 sm:text-2xl"
      >
        No job applications yet.
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        Track every application in one place — from first draft to final round.
      </p>

      <ol className="mt-5">
        <li>
          <button
            type="button"
            onClick={onAddFirstJob}
            className="relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-indigo-500 bg-indigo-600 py-4 pl-6 pr-4 text-left text-white shadow-md transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-indigo-400 dark:focus-visible:ring-yellow-400 dark:focus-visible:ring-offset-slate-800 sm:pl-7"
          >
            <span
              aria-hidden
              className="absolute left-0 top-0 h-full w-2 bg-indigo-300 dark:bg-indigo-200 sm:w-3"
            />
            <FileInput size={20} className="shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-semibold">
                Applying
              </span>
              <span className="block text-sm text-indigo-100">
                Add your first job
              </span>
            </span>
            <Plus size={20} className="shrink-0" aria-hidden />
          </button>
        </li>

        {GHOST_STAGES.map(({ label, hint, Icon, stripe }) => (
          <li key={label}>
            <Connector />
            <div className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-dashed border-gray-300 bg-white/60 py-3.5 pl-6 pr-4 dark:border-slate-600 dark:bg-slate-800/40 sm:pl-7">
              <span
                aria-hidden
                className={`absolute left-0 top-0 h-full w-2 opacity-70 sm:w-3 ${stripe}`}
              />
              <Icon
                size={18}
                className="shrink-0 text-gray-400 dark:text-slate-500"
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-500 dark:text-slate-300">
                  {label}
                </span>
                <span className="block text-xs text-gray-400 dark:text-slate-400">
                  {hint}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        Your cards move down this path as you go.
      </p>
    </section>
  );
}
