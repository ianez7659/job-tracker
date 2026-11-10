"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Link2, Loader2, MoreHorizontal, Sparkles, Trash2 } from "lucide-react";
import { JobSource } from "@/generated/prisma";
import { getAdvanceButtonLabel, getNextStageLabel } from "@/lib/jobPipeline";
import { addedAgoLabel } from "@/lib/relativeDate";
import PipelineRail from "@/components/PipelineRail";
import { toast } from "sonner";

type JobCardProps = {
  id: string;
  /** Position level (the "Position level" select), shown as a chip. */
  title: string;
  company: string;
  status: string;
  /** Set once when the card is created; shown as "Added N days ago". */
  appliedAt?: string | Date | null;
  /** Last open stage of a closed cycle; lets the rail show where it ended. */
  cycleEndStage?: string | null;
  /** Called after this card's own soft-delete request succeeded — update state only, do not PATCH again. */
  onDelete: (id: string) => void;
  /** Called after Undo restored the job. Without it the card falls back to `router.refresh()`. */
  onRestored?: (id: string) => void;
  url?: string | null;
  source?: JobSource | null;
  /** One-tap move to the next stage. Without it the card shows no advance button. */
  onAdvance?: (job: { id: string; company: string; status: string }) => void;
  /** A move for this card is waiting out its Undo window. */
  advancePending?: boolean;
  /** Saves a pending move before the detail page opens, so it shows the new stage. */
  onBeforeOpen?: (id: string) => Promise<void>;
};

/** Raised above the headline link's full-card hit area. */
const ABOVE_LINK = "relative z-[2]";

const primaryAction =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-signal-solid px-4 text-sm font-semibold text-white transition-colors hover:bg-signal-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-wait disabled:opacity-70 sm:min-h-10";

const secondaryAction =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-2 border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:border-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal sm:min-h-10";

const menuItem =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-ink outline-none hover:bg-canvas-alt focus-visible:bg-canvas-alt focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal";

type MenuProps = {
  label: string;
  url?: string | null;
  prepHref?: string | null;
  onTrash: () => void;
};

/** "···" menu holding the card's secondary actions. Keyboard: arrows move, Escape closes. */
function CardMenu({ label, url, prepHref, onTrash }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const items = () =>
    Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      list[(at + step + list.length) % list.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      list[e.key === "Home" ? 0 : list.length - 1]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    // z-[3], one above ABOVE_LINK: this wrapper is the menu's stacking context,
    // so it must outrank the card's action button, which comes later in the DOM
    // and would otherwise paint over the open menu where they overlap (phone).
    <div ref={rootRef} className="relative z-[3] -mr-1.5 -mt-1 shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`More actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-canvas-alt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      >
        <MoreHorizontal size={20} aria-hidden />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={`Actions for ${label}`}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-30 mt-1 flex w-56 flex-col gap-0.5 rounded-xl border border-line bg-surface p-1.5 shadow-2xl"
        >
          {url && (
            <a
              role="menuitem"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={menuItem}
            >
              <Link2 size={16} className="shrink-0 text-ink-muted" aria-hidden />
              Open original posting
            </a>
          )}
          {prepHref && (
            <Link role="menuitem" href={prepHref} onClick={() => setOpen(false)} className={menuItem}>
              <Sparkles size={16} className="shrink-0 text-signal" aria-hidden />
              Interview prep
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              close(true);
              onTrash();
            }}
            className={`${menuItem} text-red-700 hover:bg-red-50 focus-visible:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40 dark:focus-visible:bg-red-950/40`}
          >
            <Trash2 size={16} className="shrink-0" aria-hidden />
            Move to trash
          </button>
        </div>
      )}
    </div>
  );
}

export default function JobCard({
  id,
  title,
  company,
  status,
  appliedAt,
  cycleEndStage,
  onDelete,
  onRestored,
  url,
  source,
  onAdvance,
  advancePending = false,
  onBeforeOpen,
}: JobCardProps) {
  const router = useRouter();
  const headline = company.trim() || title.trim() || "Untitled job";
  const level = title.trim() && headline !== title.trim() ? title.trim() : null;
  const added = addedAgoLabel(appliedAt);
  const nextLabel = getNextStageLabel(status);
  const isClosed = status === "offer" || status === "rejected";

  const detailHref =
    status === "applying"
      ? `/dashboard/jobs/apply/${id}`
      : `/dashboard/jobs/edit/${id}`;

  const handleOpen = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!advancePending || !onBeforeOpen) return;
    // Let the pending move land first; otherwise the detail page renders the old stage.
    e.preventDefault();
    await onBeforeOpen(id);
    router.push(detailHref);
  };

  const handleDelete = async () => {
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

  let action: React.ReactNode = null;
  if (status === "applying") {
    action = (
      <Link href={detailHref} className={`${ABOVE_LINK} ${primaryAction}`}>
        Submit application
        <ArrowRight size={16} aria-hidden />
      </Link>
    );
  } else if (advancePending) {
    action = (
      <button type="button" disabled className={`${ABOVE_LINK} ${primaryAction}`}>
        <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />
        Saving…
      </button>
    );
  } else if (nextLabel && onAdvance) {
    const verb = getAdvanceButtonLabel(status) ?? `Move to ${nextLabel}`;
    action = (
      <button
        type="button"
        onClick={() => onAdvance({ id, company, status })}
        aria-label={`${verb} for ${headline}`}
        className={`${ABOVE_LINK} ${primaryAction}`}
      >
        {verb}
        <ArrowRight size={16} aria-hidden />
      </button>
    );
  } else if (status === "interview3") {
    // The outcome (Offer / Rejected) is recorded on the job page.
    action = (
      <Link href={detailHref} className={`${ABOVE_LINK} ${secondaryAction}`}>
        Record outcome
        <ArrowRight size={16} aria-hidden />
      </Link>
    );
  }

  return (
    <article className="relative rounded-xl border border-line bg-surface shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-signal hover:shadow-xl hover:ring-2 hover:ring-signal/25 has-[[aria-expanded=true]]:z-30 has-[.job-card-link:focus-visible]:ring-2 has-[.job-card-link:focus-visible]:ring-signal has-[.job-card-link:focus-visible]:ring-offset-2 has-[.job-card-link:focus-visible]:ring-offset-canvas">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h3 className="font-display text-lg font-semibold leading-tight text-ink">
              {/* The headline link covers the whole card, so the card opens on a
                  tap anywhere without wrapping other controls in an interactive element. */}
              <Link
                href={detailHref}
                onClick={handleOpen}
                className="job-card-link break-words outline-none after:absolute after:inset-0 after:z-[1] after:rounded-xl after:content-['']"
              >
                {headline}
              </Link>
            </h3>
            {(level || added) && (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                {level && (
                  <span className="rounded-full border border-line bg-canvas px-2 py-0.5 text-xs font-medium leading-none text-ink-muted">
                    {level}
                  </span>
                )}
                {added && <span>{added}</span>}
              </p>
            )}
          </div>
          <CardMenu
            label={headline}
            url={url}
            prepHref={source === JobSource.WALK_IN ? `/dashboard/jobs/edit/${id}#interview-prep` : null}
            onTrash={() => void handleDelete()}
          />
        </div>

        <PipelineRail status={status} cycleEndStage={cycleEndStage} variant="card" />

        {!isClosed && action && (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-xs text-ink-muted">Next checkpoint</span>
            {/* Stays on the right when it wraps under the label on narrow cards. */}
            <span className="ml-auto">{action}</span>
          </div>
        )}
      </div>
    </article>
  );
}
