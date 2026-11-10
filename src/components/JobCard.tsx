"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Calendar, Building2, Link2, Sparkles } from "lucide-react";
import { JobSource } from "@/generated/prisma";
import { getAdvanceButtonLabel } from "@/lib/jobPipeline";
import { statusColorClass } from "@/lib/jobStatusColors";
import { toast } from "sonner";

type JobCardProps = {
  id: string;
  title: string;
  company: string;
  status: string;
  appliedAt?: string | Date | null;
  /** Called after this card's own soft-delete request succeeded — update state only, do not PATCH again. */
  onDelete: (id: string) => void;
  /** Called after Undo restored the job. Without it the card falls back to `router.refresh()`. */
  onRestored?: (id: string) => void;
  url?: string | null;
  source?: JobSource | null;
};

export default function JobCard({
  id,
  title,
  company,
  status,
  appliedAt,
  onDelete,
  onRestored,
  url,
  source,
}: JobCardProps) {
  const router = useRouter();
  const showWalkInPrepLink = source === JobSource.WALK_IN;

  const detailHref =
    status === "applying"
      ? `/dashboard/jobs/apply/${id}`
      : `/dashboard/jobs/edit/${id}`;

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ softDelete: true }),
    });
    if (!res.ok) {
      toast.error("Failed to delete job");
      return;
    }
    onDelete(id);
    toast("Moved to Trash", {
      description: `${title} @ ${company}`,
      action: {
        label: "Undo",
        onClick: async () => {
          const restore = await fetch(`/api/jobs/${id}/restore`, {
            method: "PATCH",
          });
          if (restore.ok) {
            toast.success("Restored");
            if (onRestored) onRestored(id);
            else router.refresh();
          } else {
            toast.error("Failed to restore job");
          }
        },
      },
    });
  };

  return (
    <div
      className="relative rounded-xl border border-line bg-surface overflow-hidden flex cursor-pointer shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-signal/5 hover:shadow-xl hover:border-signal hover:ring-2 hover:ring-signal/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
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
      <div
        className={`w-2 sm:w-3 h-full ${statusColorClass(status)} absolute left-0 top-0 z-[1]`}
      />

      <div className="py-2 sm:py-1 px-6 pl-6 flex-1 flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-xl font-semibold text-ink min-w-0 flex-1 leading-snug">
              {title}
            </h3>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-muted transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-300"
              aria-label="Move job to trash"
              title="Move to trash"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          <div className="text-sm text-ink-muted flex items-center gap-1 ">
            <Building2 size={14} />
            {company}
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-ink-muted">
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
              className="text-signal flex items-center gap-1 hover:underline"
            >
              <Link2 size={14} />
              Link to original posting
            </a>
          )}
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${statusColorClass(status)}`}
          >
            {status === "resume"
              ? "APPLIED"
              : status.toUpperCase()}
          </span>
          {showWalkInPrepLink && (
            <Link
              href={`/dashboard/jobs/edit/${id}#interview-prep`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 self-start text-xs font-medium px-2.5 py-1.5 rounded-lg border border-signal/30 bg-signal/10 text-signal hover:bg-signal/15 transition-colors"
            >
              <Sparkles size={14} className="shrink-0" />
              Interview prep →
            </Link>
          )}
          <p className="text-xs text-ink-muted leading-snug">
            {status === "offer" || status === "rejected" ? (
              <>Closed outcome — open for details.</>
            ) : (
              <>
                Advance stages from the job detail page
                {getAdvanceButtonLabel(status) ? (
                  <span className="block mt-0.5 text-ink-muted">
                    Next: {getAdvanceButtonLabel(status)}
                  </span>
                ) : status === "interview3" ? (
                  <span className="block mt-0.5 text-ink-muted">
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
