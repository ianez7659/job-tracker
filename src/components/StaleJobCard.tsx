"use client";

import { useRouter } from "next/navigation";
import { X, Calendar, Building2, Link2, Clock } from "lucide-react";

type Props = {
  id: string;
  title: string;
  company: string;
  createdAt: string;
  daysInApplying: number;
  url?: string | null;
  hasUrl: boolean;
  hasJd: boolean;
  onRemove: (id: string) => void;
  busy?: boolean;
};

export default function StaleJobCard({
  id,
  title,
  company,
  createdAt,
  daysInApplying,
  url,
  hasUrl,
  hasJd,
  onRemove,
  busy = false,
}: Props) {
  const router = useRouter();

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const ok = window.confirm(
      "Move this job to Trash? You can restore it from the Trash Bin later.",
    );
    if (!ok) return;
    onRemove(id);
  };

  return (
    <div
      className="relative rounded-xl border border-gray-400 dark:border-slate-700 bg-white dark:bg-slate-600 overflow-hidden flex cursor-pointer shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-indigo-50/60 hover:shadow-xl hover:border-indigo-500 hover:ring-2 hover:ring-indigo-200/90 dark:hover:bg-slate-500 dark:hover:border-yellow-500/70 dark:hover:ring-yellow-400/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      onClick={() => router.push(`/dashboard/jobs/edit/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/dashboard/jobs/edit/${id}`);
        }
      }}
    >
      {/* Status color bar — applying color */}
      <div className="w-2 sm:w-3 h-full bg-indigo-100 text-indigo-900 dark:bg-indigo-600 absolute left-0 top-0 z-[1]" />

      <div className="py-2 sm:py-1 px-6 pl-6 flex-1 flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 min-w-0 flex-1 leading-snug">
              {title || "Untitled"}
            </h3>
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-400 dark:hover:border-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-300 disabled:opacity-50"
              aria-label="Move job to trash"
              title="Move to trash"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-200 flex items-center gap-1">
            <Building2 size={14} />
            {company || "Unknown company"}
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-200">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            {new Date(createdAt).toLocaleDateString()}
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 flex items-center gap-1 hover:underline dark:text-yellow-400"
            >
              <Link2 size={14} />
              Link to original posting
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-1 mb-1">
          {/* Days in applying badge */}
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-900 dark:bg-indigo-600 dark:text-indigo-50">
            <Clock size={11} />
            {daysInApplying} day{daysInApplying === 1 ? "" : "s"} in Applying
          </span>

          {/* Missing info flags */}
          {!hasUrl && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              No URL
            </span>
          )}
          {!hasJd && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              No JD
            </span>
          )}

          <p className="w-full text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
            Click to edit — update status, add URL or job description.
          </p>
        </div>
      </div>
    </div>
  );
}
