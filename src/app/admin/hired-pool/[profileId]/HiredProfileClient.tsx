"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HiredProfileDetail } from "@/domains/admin/hiredPool";

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

function NotesEditor({
  profileId,
  initialNotes,
}: {
  profileId: string;
  initialNotes: string | null;
}) {
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
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
        Admin Notes
      </label>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        rows={3}
        placeholder="Add notes about this candidate..."
        className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={!isDirty || saving}
          className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
        >
          {saving ? "Saving…" : "Save Notes"}
        </button>
        {saved && <span className="text-xs text-emerald-500">Saved</span>}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}

// ── Offer Card ────────────────────────────────────────────────────────────────

type OfferState = HiredProfileDetail["offers"][number];

function OfferCard({
  offer,
  onUpdate,
}: {
  offer: OfferState;
  onUpdate: (offerId: string, newStatus: string) => void;
}) {
  const [loading, setLoading] = useState<
    "verify" | "unverifiable" | "deactivate" | null
  >(null);
  const [error, setError] = useState("");

  async function doAction(action: "verify" | "unverifiable" | "deactivate") {
    setLoading(action);
    setError("");

    const urlMap = {
      verify: `/api/admin/hired/offers/${offer.offerId}/verify`,
      unverifiable: `/api/admin/hired/offers/${offer.offerId}/mark-unverifiable`,
      deactivate: `/api/admin/hired/offers/${offer.offerId}/admin-deactivate`,
    };

    try {
      const res = await fetch(urlMap[action], { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { offer: { status: string } };
      onUpdate(offer.offerId, data.offer.status);
    } catch {
      setError("Request failed");
    } finally {
      setLoading(null);
    }
  }

  const canVerify =
    offer.status !== "current_hired" && offer.status !== "inactive";
  const canMarkUnverifiable = offer.status === "pending";
  const canDeactivate = offer.status !== "inactive";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Offer header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {offer.company}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{offer.title}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[offer.status] ?? STATUS_COLORS.inactive}`}
        >
          {STATUS_LABELS[offer.status] ?? offer.status}
        </span>
      </div>

      {/* Offer details */}
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-gray-400">Offer Date</dt>
          <dd className="mt-0.5 font-medium text-gray-700 dark:text-gray-300">
            {offer.offerDate
              ? new Date(offer.offerDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-400">Employment</dt>
          <dd className="mt-0.5 font-medium text-gray-700 dark:text-gray-300">
            {offer.employmentType ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-400">Arrangement</dt>
          <dd className="mt-0.5 font-medium text-gray-700 dark:text-gray-300">
            {offer.workArrangement ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-400">Salary Range</dt>
          <dd className="mt-0.5 font-medium text-gray-700 dark:text-gray-300">
            {offer.salaryRange ?? "—"}
          </dd>
        </div>
        {offer.verifiedAt && (
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-gray-400">Verified At</dt>
            <dd className="mt-0.5 font-medium text-emerald-600 dark:text-emerald-400">
              {new Date(offer.verifiedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </dd>
          </div>
        )}
      </dl>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canVerify && (
          <button
            onClick={() => doAction("verify")}
            disabled={loading !== null}
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            {loading === "verify" ? "Processing…" : "Verify"}
          </button>
        )}
        {canMarkUnverifiable && (
          <button
            onClick={() => doAction("unverifiable")}
            disabled={loading !== null}
            className="rounded-md bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200 disabled:opacity-40 transition-colors dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50"
          >
            {loading === "unverifiable" ? "Processing…" : "Mark Unverifiable"}
          </button>
        )}
        {canDeactivate && (
          <button
            onClick={() => doAction("deactivate")}
            disabled={loading !== null}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {loading === "deactivate" ? "Processing…" : "Deactivate"}
          </button>
        )}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}

// ── Main Client ───────────────────────────────────────────────────────────────

interface Props {
  profile: HiredProfileDetail;
}

export default function HiredProfileClient({ profile }: Props) {
  const router = useRouter();
  const [offers, setOffers] = useState(profile.offers);

  function handleOfferUpdate(offerId: string, newStatus: string) {
    setOffers((prev) =>
      prev.map((o) => (o.offerId === offerId ? { ...o, status: newStatus } : o)),
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/admin/hired-rate")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Hired Rate
      </button>

      {/* Offers section */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Offers ({offers.length})
        </h2>
        {offers.length === 0 ? (
          <p className="text-sm text-gray-400">No offers on record.</p>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => (
              <OfferCard
                key={offer.offerId}
                offer={offer}
                onUpdate={handleOfferUpdate}
              />
            ))}
          </div>
        )}
      </section>

      {/* Notes section */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <NotesEditor
          profileId={profile.profileId}
          initialNotes={profile.notes}
        />
      </section>
    </div>
  );
}
