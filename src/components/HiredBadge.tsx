"use client";

import { useState } from "react";
import { BadgeCheck, ChevronDown, LogOut } from "lucide-react";

export type ActiveOffer = {
  offerId: string;
  company: string;
  title: string;
  offerDate: string | null;
  employmentType: string | null;
  workArrangement: string | null;
};

const DEACTIVATE_REASONS = [
  "Position ended",
  "Left voluntarily",
  "Found a better opportunity",
  "Contract completed",
  "Other",
] as const;

type Props = {
  offer: ActiveOffer;
  onDeactivated: () => void;
};

export default function HiredBadge({ offer, onDeactivated }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sinceLabel = offer.offerDate
    ? new Date(offer.offerDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
      })
    : null;

  const handleLeaveClick = () => {
    setMenuOpen(false);
    setConfirming(true);
  };

  const handleCancel = () => {
    setConfirming(false);
    setReason("");
    setError(null);
  };

  const handleConfirmLeave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hired/offers/${offer.offerId}/deactivate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || null }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Could not deactivate offer");
      }
      setConfirming(false);
      onDeactivated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Badge bar */}
      <div className="relative flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 dark:border-emerald-700 dark:bg-emerald-950/40">
        <BadgeCheck
          size={18}
          className="shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Hired at {offer.company}
          </p>
          <p className="truncate text-xs text-emerald-700 dark:text-emerald-300">
            {offer.title}
            {sinceLabel && (
              <span className="ml-1.5 text-emerald-600/70 dark:text-emerald-400/70">
                · Since {sinceLabel}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Hired position options"
          aria-expanded={menuOpen}
          className="shrink-0 flex items-center gap-0.5 rounded-md px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
        >
          Options
          <ChevronDown size={14} className={menuOpen ? "rotate-180 transition-transform" : "transition-transform"} />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
            <button
              type="button"
              onClick={handleLeaveClick}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
            >
              <LogOut size={15} aria-hidden />
              Leave this position
            </button>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-dialog-title"
        >
          <div className="w-full max-w-sm rounded-xl border border-rose-200 bg-white shadow-2xl dark:border-rose-800 dark:bg-slate-800">
            <div className="rounded-t-xl border-b border-rose-100 bg-rose-50 px-5 py-4 dark:border-rose-900 dark:bg-rose-950/30">
              <h2
                id="leave-dialog-title"
                className="text-base font-bold text-rose-900 dark:text-rose-100"
              >
                Leave this position?
              </h2>
              <p className="mt-0.5 text-sm text-rose-700 dark:text-rose-300">
                Your hired badge will be removed. You can continue using the app normally.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="leave-reason"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                >
                  Reason{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  id="leave-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400 dark:border-slate-500 dark:bg-slate-700 dark:text-gray-100"
                >
                  <option value="">Select a reason…</option>
                  {DEACTIVATE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleConfirmLeave}
                  disabled={loading}
                  className="flex-1 rounded-md bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-500 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
