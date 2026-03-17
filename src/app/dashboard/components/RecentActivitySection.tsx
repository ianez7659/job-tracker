"use client";

import Link from "next/link";

type JobLike = {
  id: string;
  company: string | null;
  title?: string | null;
  createdAt?: unknown;
};

type Props = {
  jobs: JobLike[];
  maxItems?: number;
};

function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val as string | number);
  return isNaN(d.getTime()) ? null : d;
}

export default function RecentActivitySection({
  jobs,
  maxItems = 5,
}: Props) {
  const sorted = [...jobs]
    .filter((j) => toDate(j.createdAt) !== null)
    .sort((a, b) => {
      const da = toDate(a.createdAt)!.getTime();
      const db = toDate(b.createdAt)!.getTime();
      return db - da;
    })
    .slice(0, maxItems);

  if (sorted.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide flex items-center gap-1.5">
          Recent activity
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No recent applications yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide flex items-center gap-1.5">
        Recent activity
      </h3>
      <ul className="space-y-1.5 border border-gray-400 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800/50">
        {sorted.map((job) => {
          const d = toDate(job.createdAt);
          return (
            <li key={job.id}>
              <Link
                href={`/dashboard/jobs/edit/${job.id}`}
                className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <span className="truncate font-medium">
                  {job.company ?? "Untitled"}
                </span>
                <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  {d ? `Added · ${formatRelative(d)}` : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
