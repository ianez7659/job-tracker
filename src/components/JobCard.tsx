"use client";

import { useRouter } from "next/navigation";
import { X, Calendar, Building2, Link2 } from "lucide-react";
import { getAdvanceButtonLabel } from "@/lib/jobPipeline";

type JobCardProps = {
  id: string;
  title: string;
  company: string;
  status: string;
  appliedAt?: string | Date | null;
  onDelete: (id: string) => void;
  url?: string | null;
};

export default function JobCard({
  id,
  title,
  company,
  status,
  appliedAt,
  onDelete,
  url,
}: JobCardProps) {
  const router = useRouter();
  const statusColors: Record<string, string> = {
    applying:
      "bg-indigo-100 text-indigo-900 dark:bg-indigo-600 dark:text-indigo-50",
    resume:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-600 dark:text-emerald-50",
    interview1: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500 dark:text-yellow-100",
    interview2: "bg-orange-200 text-orange-900 dark:bg-orange-500 dark:text-orange-100",
    interview3: "bg-orange-400 text-orange-900 dark:bg-orange-500 dark:text-orange-100",
    offer: "bg-green-200 text-green-800",
    rejected: "bg-red-200 text-red-800",
  };

  const detailHref =
    status === "applying"
      ? `/dashboard/jobs/apply/${id}`
      : `/dashboard/jobs/edit/${id}`;

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const ok = window.confirm(
      "Move this job to Trash? You can restore it from the Trash Bin later.",
    );
    if (!ok) return;
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ softDelete: true }),
    });
    if (res.ok) {
      onDelete(id);
    } else {
      alert("Failed to delete job");
    }
  };

  return (
    <div
      className="relative rounded-xl border border-gray-400 dark:border-slate-700 bg-white dark:bg-slate-600 overflow-hidden flex cursor-pointer shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-indigo-50/60 hover:shadow-xl hover:border-indigo-500 hover:ring-2 hover:ring-indigo-200/90 dark:hover:bg-slate-500 dark:hover:border-yellow-500/70 dark:hover:ring-yellow-400/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-yellow-400 dark:focus-visible:ring-offset-slate-900"
      onClick={() => router.push(detailHref)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(detailHref);
        }
      }}
    >
      {/* Status Indicator */}
      <div
        className={`w-2 sm:w-3 h-full ${statusColors[status]} absolute left-0 top-0 z-[1]`}
      />

      <div className="py-2 px-6 pl-6 flex-1 flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 min-w-0 flex-1 leading-snug">
              {title}
            </h3>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-500  transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-400 dark:hover:border-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-300"
              aria-label="Move job to trash"
              title="Move to trash"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-200 flex items-center gap-1 ">
            <Building2 size={14} />
            {company}
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-200">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            {appliedAt ? new Date(appliedAt).toLocaleDateString() : "No date"}
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

        <div className="flex flex-col gap-1.5 mt-2">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${statusColors[status]}`}
          >
            {status === "resume"
              ? "APPLIED"
              : status.toUpperCase()}
          </span>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
            {status === "offer" || status === "rejected" ? (
              <>Archived outcome — open for details.</>
            ) : (
              <>
                Advance stages from the job detail page
                {getAdvanceButtonLabel(status) ? (
                  <span className="block mt-0.5 text-gray-600 dark:text-gray-300">
                    Next: {getAdvanceButtonLabel(status)}
                  </span>
                ) : status === "interview3" ? (
                  <span className="block mt-0.5 text-gray-600 dark:text-gray-300">
                    Next: mark Offer or Rejected on the detail page.
                  </span>
                ) : null}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
