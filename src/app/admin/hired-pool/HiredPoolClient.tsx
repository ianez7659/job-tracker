"use client";

import { useState, useMemo } from "react";
import type { HiredPoolEntry } from "@/domains/admin/hiredPool";

// ── Label maps ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  current_hired: "Verified",
  inactive: "Inactive",
  not_selected: "Not Selected",
  unverifiable: "Unverifiable",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  current_hired: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  not_selected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  unverifiable: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

// ── Notes Editor ──────────────────────────────────────────────────────────────

function NotesEditor({ profileId, initialNotes }: { profileId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const isDirty = notes !== (initialNotes ?? "");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/hired/profile/${profileId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 space-y-1.5">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes</label>
      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        rows={2}
        placeholder="admin 메모..."
        className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={!isDirty || saving}
          className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
        {saved && <span className="text-xs text-emerald-500">저장됨</span>}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}

// ── Offer Row ─────────────────────────────────────────────────────────────────

function OfferRow({ offer, onUpdate }: {
  offer: HiredPoolEntry["offers"][number];
  onUpdate: (offerId: string, newStatus: string) => void;
}) {
  const [loading, setLoading] = useState<"verify" | "deactivate" | null>(null);
  const [error, setError] = useState("");

  async function doAction(action: "verify" | "deactivate") {
    setLoading(action);
    setError("");
    const url = action === "verify"
      ? `/api/admin/hired/offers/${offer.offerId}/verify`
      : `/api/admin/hired/offers/${offer.offerId}/admin-deactivate`;
    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { offer: { status: string } };
      onUpdate(offer.offerId, data.offer.status);
    } catch {
      setError("요청 실패");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {offer.company} — {offer.title}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            {offer.offerDate ? new Date(offer.offerDate).toLocaleDateString() : "날짜 미입력"}
            {offer.employmentType ? ` · ${offer.employmentType}` : ""}
            {offer.salaryRange ? ` · ${offer.salaryRange}` : ""}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[offer.status] ?? STATUS_COLORS.inactive}`}>
          {STATUS_LABELS[offer.status] ?? offer.status}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {offer.status !== "current_hired" && offer.status !== "inactive" && (
          <button
            onClick={() => doAction("verify")}
            disabled={loading !== null}
            className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            {loading === "verify" ? "처리 중…" : "Verify"}
          </button>
        )}
        {offer.status !== "inactive" && (
          <button
            onClick={() => doAction("deactivate")}
            disabled={loading !== null}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {loading === "deactivate" ? "처리 중…" : "Deactivate"}
          </button>
        )}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}

// ── Profile Card ──────────────────────────────────────────────────────────────

function ProfileCard({ entry }: { entry: HiredPoolEntry }) {
  const [offers, setOffers] = useState(entry.offers);

  function handleOfferUpdate(offerId: string, newStatus: string) {
    setOffers((prev) =>
      prev.map((o) => o.offerId === offerId ? { ...o, status: newStatus } : o),
    );
  }

  const activeOffer = offers.find((o) => o.status === "current_hired");
  const cardBorder = activeOffer
    ? "border-emerald-200 dark:border-emerald-800"
    : "border-gray-200 dark:border-gray-700";

  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-900 ${cardBorder}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {entry.userName ?? "—"}
          </p>
          <p className="text-xs text-gray-400">{entry.userEmail}</p>
        </div>
        <span className="text-xs text-gray-400">
          {offers.length} offer{offers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Offers */}
      <div className="mt-3 space-y-2">
        {offers.length === 0 ? (
          <p className="text-xs text-gray-400">No offers</p>
        ) : (
          offers.map((offer) => (
            <OfferRow key={offer.offerId} offer={offer} onUpdate={handleOfferUpdate} />
          ))
        )}
      </div>

      {/* Notes */}
      <NotesEditor profileId={entry.profileId} initialNotes={entry.notes} />
    </div>
  );
}

// ── Main Client ───────────────────────────────────────────────────────────────

interface Props {
  entries: HiredPoolEntry[];
}

export default function HiredPoolClient({ entries }: Props) {
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = useMemo(() => {
    if (!filterStatus) return entries;
    return entries.filter((e) =>
      e.offers.some((o) => o.status === filterStatus),
    );
  }, [entries, filterStatus]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        {filterStatus && (
          <button
            onClick={() => setFilterStatus("")}
            className="text-sm text-gray-400 underline hover:text-gray-600 dark:hover:text-gray-200"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-sm text-gray-400">
          {filtered.length} / {entries.length} profiles
        </span>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-gray-400">No profiles found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <ProfileCard key={entry.profileId} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
