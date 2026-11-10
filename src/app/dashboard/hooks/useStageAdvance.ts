"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getNextStage, getNextStageLabel } from "@/lib/jobPipeline";

/** How long the Undo stays available before the stage change is sent. */
export const ADVANCE_UNDO_MS = 5000;

type Pending = {
  from: string;
  to: string;
  timer: ReturnType<typeof setTimeout>;
  toastId: string | number;
};

type Options = {
  /** Apply a status to local board state (optimistic move, undo, or revert). */
  onLocalStatus: (id: string, status: string) => void;
  /** The server accepted the change. */
  onCommitted?: (id: string, status: string, xpGained: number) => void;
  undoMs?: number;
};

type AdvanceInput = { id: string; company: string; status: string };

/**
 * One-tap stage advance for board cards.
 *
 * The API forbids moving a job backwards, so the PATCH is held for an Undo
 * window: the card moves at once, a toast offers Undo, and only when the
 * window closes is the status-only PATCH sent. The timer is the single source
 * of truth — when it fires the toast is dismissed, so Undo can never be clicked
 * after the request went out.
 *
 * Pending changes are flushed, not dropped: on unmount and on `pagehide` they
 * are sent with `keepalive`, so the board never shows a move that was not
 * saved and a move the user did not undo is never lost.
 */
export function useStageAdvance({ onLocalStatus, onCommitted, undoMs = ADVANCE_UNDO_MS }: Options) {
  const pendingRef = useRef(new Map<string, Pending>());
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set());

  // Keep the latest callbacks without re-creating `advance` on every render.
  const callbacks = useRef({ onLocalStatus, onCommitted });
  callbacks.current = { onLocalStatus, onCommitted };

  const syncPendingIds = useCallback(() => {
    setPendingIds(new Set(pendingRef.current.keys()));
  }, []);

  const take = useCallback(
    (id: string): Pending | undefined => {
      const pending = pendingRef.current.get(id);
      if (!pending) return undefined;
      clearTimeout(pending.timer);
      toast.dismiss(pending.toastId);
      pendingRef.current.delete(id);
      syncPendingIds();
      return pending;
    },
    [syncPendingIds],
  );

  const send = useCallback(async (id: string, pending: Pending, keepalive = false) => {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pending.to }),
        keepalive,
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        xpGained?: number;
      };
      if (!res.ok) {
        callbacks.current.onLocalStatus(id, pending.from);
        toast.error(
          typeof data.message === "string" ? data.message : "Could not update stage",
        );
        return;
      }
      callbacks.current.onCommitted?.(id, pending.to, data.xpGained ?? 0);
    } catch {
      callbacks.current.onLocalStatus(id, pending.from);
      toast.error("Could not update stage");
    }
  }, []);

  /** Send one job's pending change now (e.g. before opening its detail page). */
  const flush = useCallback(
    async (id: string) => {
      const pending = take(id);
      if (pending) await send(id, pending);
    },
    [take, send],
  );

  const advance = useCallback(
    ({ id, company, status }: AdvanceInput) => {
      // Double taps and a second advance before the first is saved are ignored:
      // each saved step must be a single allowed transition from the server's state.
      if (pendingRef.current.has(id)) return;
      const to = getNextStage(status);
      const label = getNextStageLabel(status);
      if (!to || !label) return;

      callbacks.current.onLocalStatus(id, to);

      const toastId = toast(`Moved to ${label}`, {
        description: company,
        duration: undoMs,
        action: {
          label: "Undo",
          onClick: () => {
            const undone = take(id);
            if (undone) callbacks.current.onLocalStatus(id, undone.from);
          },
        },
      });

      const timer = setTimeout(() => {
        const pending = take(id);
        if (pending) void send(id, pending);
      }, undoMs);

      pendingRef.current.set(id, { from: status, to, timer, toastId });
      syncPendingIds();
    },
    [take, send, syncPendingIds, undoMs],
  );

  // Flush everything still pending when the board unmounts or the tab goes away.
  useEffect(() => {
    const pendingMap = pendingRef.current;
    const flushAll = () => {
      for (const [id, pending] of Array.from(pendingMap.entries())) {
        clearTimeout(pending.timer);
        toast.dismiss(pending.toastId);
        pendingMap.delete(id);
        void send(id, pending, true);
      }
    };
    // A page restored from the back/forward cache must not keep stale pending flags.
    const onPageHide = () => {
      flushAll();
      syncPendingIds();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      flushAll();
    };
  }, [send, syncPendingIds]);

  return { advance, flush, pendingIds };
}
