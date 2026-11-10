"use client";

import { FileInput, Send, MessageSquare } from "lucide-react";
import type { StatusFilter } from "@/app/dashboard/lib/jobs/metrics";

type Props = {
  /** Applying stage, stale cards included (same number as Overview). */
  applyingCount: number;
  /** Applied stage only (`resume`). */
  appliedCount: number;
  /** All interview rounds. */
  interviewCount: number;
  setFilterStatus: (s: StatusFilter) => void;
  embedded?: boolean;
  currentStatus?: StatusFilter;
};

export default function ProgressSection({
  applyingCount,
  appliedCount,
  interviewCount,
  setFilterStatus,
  embedded = false,
  currentStatus,
}: Props) {
  const rows = [
    {
      label: "Applying",
      value: applyingCount,
      icon: <FileInput size={18} />,
      onClick: () => setFilterStatus("applying"),
      isActive: (s?: StatusFilter) => s === "applying",
    },
    {
      label: "Applied",
      value: appliedCount,
      icon: <Send size={18} />,
      onClick: () => setFilterStatus("resume"),
      isActive: (s?: StatusFilter) => s === "resume",
    },
    {
      label: "Interviews",
      value: interviewCount,
      icon: <MessageSquare size={18} />,
      onClick: () => setFilterStatus("interviews"),
      isActive: (s?: StatusFilter) =>
        s === "interviews" ||
        s === "interview1" ||
        s === "interview2" ||
        s === "interview3",
    },
  ];

  const content = (
    <div className="space-y-1.5 border border-gray-400 dark:border-slate-300 rounded-lg p-2">
      {rows.map((row) => {
        const isActive = row.isActive(currentStatus);
        const baseClass = embedded
          ? "hover:bg-slate-100 dark:hover:bg-slate-600/40"
          : "bg-slate-100 dark:bg-slate-600/50 hover:bg-slate-200 dark:hover:bg-slate-600";
        const activeClass = isActive
          ? " ring-2 ring-signal/40 bg-signal/15"
          : "";
        return (
          <button
            key={row.label}
            type="button"
            onClick={row.onClick}
            aria-pressed={isActive}
            className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors text-gray-700 dark:text-gray-200 ${baseClass}${activeClass}`}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              {row.icon}
              {row.label}
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {row.value}
            </span>
          </button>
        );
      })}
    </div>
  );

  if (embedded) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide">
          Progress
        </h3>
        {content}
      </div>
    );
  }

  return (
    <section className="mb-4 border border-gray-400 dark:border-slate-200 rounded-lg bg-white dark:bg-slate-700 shadow-sm p-4">
      <h2 className="font-bold text-xl text-gray-700 dark:text-gray-200 mb-3">
        Progress
      </h2>
      {content}
    </section>
  );
}
