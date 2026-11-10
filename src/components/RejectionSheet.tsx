"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { summarizeEffort, type EffortJob } from "@/lib/effortSummary";

export const CLOSE_FAILED_MESSAGE = "Couldn’t close it. Try again.";

type Effort = { applicationsSent: number; interviewsReached: number; dayStreak: number };

type Props = {
  open: boolean;
  /** Performs the status change. Rejects (throws) when it fails. */
  onConfirm: () => Promise<void>;
  /** Called when the sheet should close (cancel, Escape, backdrop, Done, or a next action). */
  onClose: () => void;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Loads the effort numbers; resolves to null when either request fails. */
async function loadEffort(signal: AbortSignal): Promise<Effort | null> {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [jobsRes, summaryRes] = await Promise.all([
      fetch("/api/jobs/all", { cache: "no-store", signal }),
      fetch(`/api/xp/summary?timeZone=${encodeURIComponent(timeZone)}`, {
        cache: "no-store",
        signal,
      }),
    ]);
    if (!jobsRes.ok || !summaryRes.ok) return null;
    const jobs = (await jobsRes.json()) as unknown;
    const summary = (await summaryRes.json()) as { loginStreak?: unknown };
    if (!Array.isArray(jobs) || typeof summary.loginStreak !== "number") return null;
    const { applicationsSent, interviewsReached } = summarizeEffort(jobs as EffortJob[]);
    return { applicationsSent, interviewsReached, dayStreak: summary.loginStreak };
  } catch {
    return null;
  }
}

const ghostButton =
  "flex h-11 w-full items-center justify-center rounded-xl border-2 border-line bg-surface px-4 " +
  "text-sm font-semibold text-ink transition-colors hover:bg-canvas-alt " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

export default function RejectionSheet({ open, onConfirm, onClose }: Props) {
  const titleId = useId();
  const bodyId = useId();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const keepOpenRef = useRef<HTMLButtonElement>(null);
  const doneTitleRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<Element | null>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [effort, setEffort] = useState<Effort | null>(null);
  const [effortState, setEffortState] = useState<"loading" | "ready" | "failed">("loading");

  // Reset and load each time the sheet opens; remember the trigger for focus return.
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    setStep(1);
    setPending(false);
    setError(null);
    setEffort(null);
    setEffortState("loading");

    const controller = new AbortController();
    void loadEffort(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setEffort(result);
      setEffortState(result ? "ready" : "failed");
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      controller.abort();
      document.body.style.overflow = previousOverflow;
      const trigger = triggerRef.current;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [open]);

  // Initial focus: "Keep it open" on step 1, the title on step 2.
  useEffect(() => {
    if (!open) return;
    if (step === 1) keepOpenRef.current?.focus();
    else doneTitleRef.current?.focus();
  }, [open, step]);

  const requestClose = useCallback(() => {
    if (pending) return;
    onClose();
  }, [pending, onClose]);

  const handleConfirm = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      setStep(2);
    } catch (err) {
      console.error("Closing the application failed:", err);
      setError(CLOSE_FAILED_MESSAGE);
    } finally {
      setPending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      requestClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const inside = active instanceof Node && panelRef.current.contains(active);
    if (event.shiftKey && (active === first || !inside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !inside)) {
      event.preventDefault();
      first.focus();
    }
  };

  if (typeof document === "undefined") return null;

  const ease = [0.16, 1, 0.3, 1] as const;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            data-testid="rejection-sheet-backdrop"
            aria-hidden="true"
            className="absolute inset-0 bg-ink/45 dark:bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={requestClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            onKeyDown={handleKeyDown}
            className="relative w-full max-h-[90dvh] overflow-y-auto rounded-t-2xl border border-line bg-surface px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-ink shadow-[0_-8px_32px_-12px_rgba(20,26,36,0.35)] sm:max-w-md sm:rounded-2xl sm:px-6 sm:pt-6 sm:pb-6 sm:shadow-[0_16px_40px_-16px_rgba(20,26,36,0.4)]"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.32, ease }}
          >
            <div aria-hidden="true" className="mx-auto mb-4 h-1 w-10 rounded-full bg-line sm:hidden" />

            {step === 1 ? (
              <div>
                <h2 id={titleId} className="font-display text-xl font-bold tracking-tight">
                  Close this application?
                </h2>
                <p id={bodyId} className="mt-1.5 text-sm text-ink-muted">
                  It moves to Closed. Your notes stay with it.
                </p>

                {effortState !== "failed" && (
                  <dl
                    className="mt-5 grid grid-cols-3 gap-2"
                    aria-busy={effortState === "loading"}
                  >
                    {[
                      { label: "applications sent", value: effort?.applicationsSent },
                      { label: "interviews reached", value: effort?.interviewsReached },
                      { label: "day streak", value: effort?.dayStreak },
                    ].map((tile, index) => (
                      <motion.div
                        key={tile.label}
                        className="flex flex-col-reverse justify-end gap-1 rounded-xl border border-streak/30 bg-streak/12 px-3 py-3"
                        initial={false}
                        animate={
                          effortState === "ready" && !reduceMotion
                            ? { opacity: [0.4, 1], y: [4, 0] }
                            : { opacity: 1, y: 0 }
                        }
                        transition={{ duration: 0.3, delay: index * 0.06, ease }}
                      >
                        <dt className="text-xs leading-snug text-ink-muted">{tile.label}</dt>
                        <dd className="font-mono text-2xl font-semibold leading-none tabular-nums text-ink">
                          {effortState === "ready" ? (
                            tile.value
                          ) : (
                            <span
                              aria-hidden="true"
                              className="inline-block h-6 w-8 rounded-md bg-streak/25 motion-safe:animate-pulse"
                            />
                          )}
                        </dd>
                      </motion.div>
                    ))}
                  </dl>
                )}

                {error && (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                  >
                    {error}
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={pending}
                    aria-busy={pending}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-signal-solid px-4 text-sm font-semibold text-white transition-colors hover:bg-signal-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {pending ? "Closing…" : "Close as rejected"}
                  </button>
                  <button
                    ref={keepOpenRef}
                    type="button"
                    onClick={requestClose}
                    disabled={pending}
                    className="flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-ink-muted transition-colors hover:bg-canvas-alt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-60"
                  >
                    Keep it open
                  </button>
                </div>
              </div>
            ) : (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease }}
              >
                <h2
                  id={titleId}
                  ref={doneTitleRef}
                  tabIndex={-1}
                  className="font-display text-xl font-bold tracking-tight focus:outline-none"
                >
                  Closed.
                </h2>
                <p id={bodyId} className="mt-1.5 text-sm text-ink-muted">
                  That took effort. What&rsquo;s next?
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <Link href="/dashboard?newJob=auto" onClick={onClose} className={ghostButton}>
                    Add a new job
                  </Link>
                  <Link href="/dashboard/interview-drill" onClick={onClose} className={ghostButton}>
                    Start today&rsquo;s drill
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-ink-muted transition-colors hover:bg-canvas-alt hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
