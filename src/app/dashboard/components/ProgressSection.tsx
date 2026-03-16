"use client";

import { FileInput, Send, MessageSquare, Gavel } from "lucide-react";

type FilterStatus =
  | "all"
  | "resume"
  | "interview1"
  | "interview2"
  | "interview3";

type Props = {
  resumeCount: number;
  totalActive: number;
  interviewCount: number;
  decidedCount: number;
  setFilterStatus: (s: FilterStatus) => void;
  onArchiveClick: () => void;
  embedded?: boolean;
  currentStatus?: FilterStatus;
};

export default function ProgressSection({
  resumeCount,
  totalActive,
  interviewCount,
  decidedCount,
  setFilterStatus,
  onArchiveClick,
  embedded = false,
  currentStatus,
}: Props) {
  const rows = [
    {
      label: "Applying",
      value: resumeCount,
      icon: <FileInput size={18} />,
      onClick: () => setFilterStatus("resume"),
      isActive: (s?: FilterStatus) => s === "resume",
    },
    {
      label: "Applied",
      value: totalActive,
      icon: <Send size={18} />,
      onClick: () => setFilterStatus("all"),
      isActive: (s?: FilterStatus) => s === "all",
    },
    {
      label: "Interviews",
      value: interviewCount,
      icon: <MessageSquare size={18} />,
      onClick: () => setFilterStatus("interview1"),
      isActive: (s?: FilterStatus) =>
        s === "interview1" || s === "interview2" || s === "interview3",
    },
    {
      label: "Decision",
      value: decidedCount,
      icon: <Gavel size={18} />,
      onClick: onArchiveClick,
      isActive: () => false,
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
          ? " ring-2 ring-indigo-300 dark:ring-yellow-400 bg-indigo-100 dark:bg-yellow-900/40"
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
