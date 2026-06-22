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

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

const ARRANGEMENT_LABELS: Record<string, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return email[0].toUpperCase();
}

// ── Profile Header ───────────────────────────────────────────────────────────

function ProfileHeader({
  userName,
  userEmail,
  userCategory,
  onBack,
}: {
  userName: string | null;
  userEmail: string;
  userCategory: string | null;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyEmail() {
    navigator.clipboard.writeText(userEmail).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: avatar + info */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
          {getInitials(userName, userEmail)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
              {userName ?? userEmail}
            </h1>
            {userCategory && (
              <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                {userCategory}
              </span>
            )}
          </div>
          <button
            onClick={copyEmail}
            className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            title="Copy email"
          >
            <span className="font-mono">{userEmail}</span>
            {copied ? (
              <svg className="h-3 w-3 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Right: back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 self-start rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Hired Rate
      </button>
    </div>
  );
}

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
          {saving ? "Saving..." : "Save Notes"}
        </button>
        {saved && <span className="text-xs text-emerald-500">Saved</span>}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}

// ── Active Offer Section ────────────────────────────────────────────────────

type OfferState = HiredProfileDetail["offers"][number];

function ActiveOfferSection({
  offer,
  onAction,
  loading,
  error,
}: {
  offer: OfferState;
  onAction: (offerId: string, action: "deactivate") => void;
  loading: boolean;
  error: string;
}) {
  return (
    <section className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm dark:border-emerald-800 dark:from-emerald-950/30 dark:to-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          Current Position
        </h2>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {offer.company}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{offer.title}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS.current_hired}`}>
          Verified
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-gray-400 dark:text-gray-500">Offer Date</dt>
          <dd className="mt-0.5 font-medium text-gray-700 dark:text-gray-300">
            {formatDate(offer.offerDate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400 dark:text-gray-500">Employment</dt>
          <dd className="mt-0.5 font-medium text-gray-700 dark:text-gray-300">
            {offer.employmentType ? (EMPLOYMENT_LABELS[offer.employmentType] ?? offer.employmentType) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400 dark:text-gray-500">Arrangement</dt>
          <dd className="mt-0.5 font-medium text-gray-700 dark:text-gray-300">
            {offer.workArrangement ? (ARRANGEMENT_LABELS[offer.workArrangement] ?? offer.workArrangement) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400 dark:text-gray-500">Salary Range</dt>
          <dd className="mt-0.5 font-medium text-gray-700 dark:text-gray-300">
            {offer.salaryRange ?? "—"}
          </dd>
        </div>
        {offer.verifiedAt && (
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-xs text-gray-400 dark:text-gray-500">Verified At</dt>
            <dd className="mt-0.5 font-medium text-emerald-600 dark:text-emerald-400">
              {formatDate(offer.verifiedAt)}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onAction(offer.offerId, "deactivate")}
          disabled={loading}
          className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          {loading ? "Processing..." : "Deactivate"}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </section>
  );
}

// ── History Offer Card ──────────────────────────────────────────────────────

function HistoryOfferCard({
  offer,
  onAction,
  loadingAction,
  error,
}: {
  offer: OfferState;
  onAction: (offerId: string, action: "verify" | "unverifiable" | "deactivate") => void;
  loadingAction: string | null;
  error: string;
}) {
  const canVerify = offer.status === "pending";
  const canMarkUnverifiable = offer.status === "pending";
  const canDeactivate = offer.status !== "inactive";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
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

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-gray-400">Offer Date</dt>
          <dd className="mt-0.5 font-medium text-gray-700 dark:text-gray-300">
            {formatDate(offer.offerDate)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-400">Employment</dt>
          <dd className="mt-0.5 font-medium text-gray-700 dark:text-gray-300">
            {offer.employmentType ? (EMPLOYMENT_LABELS[offer.employmentType] ?? offer.employmentType) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-400">Arrangement</dt>
          <dd className="mt-0.5 font-medium text-gray-700 dark:text-gray-300">
            {offer.workArrangement ? (ARRANGEMENT_LABELS[offer.workArrangement] ?? offer.workArrangement) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-400">Salary Range</dt>
          <dd className="mt-0.5 font-medium text-gray-700 dark:text-gray-300">
            {offer.salaryRange ?? "—"}
          </dd>
        </div>
        {offer.verifiedAt && (
          <div>
            <dt className="text-gray-400">Verified At</dt>
            <dd className="mt-0.5 font-medium text-emerald-600 dark:text-emerald-400">
              {formatDate(offer.verifiedAt)}
            </dd>
          </div>
        )}
        {offer.deactivatedAt && (
          <div>
            <dt className="text-gray-400">Deactivated At</dt>
            <dd className="mt-0.5 font-medium text-red-500 dark:text-red-400">
              {formatDate(offer.deactivatedAt)}
            </dd>
          </div>
        )}
      </dl>

      {(canVerify || canMarkUnverifiable || canDeactivate) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {canVerify && (
            <button
              onClick={() => onAction(offer.offerId, "verify")}
              disabled={loadingAction !== null}
              className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              {loadingAction === "verify" ? "Processing..." : "Verify"}
            </button>
          )}
          {canMarkUnverifiable && (
            <button
              onClick={() => onAction(offer.offerId, "unverifiable")}
              disabled={loadingAction !== null}
              className="rounded-md bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200 disabled:opacity-40 transition-colors dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50"
            >
              {loadingAction === "unverifiable" ? "Processing..." : "Mark Unverifiable"}
            </button>
          )}
          {canDeactivate && (
            <button
              onClick={() => onAction(offer.offerId, "deactivate")}
              disabled={loadingAction !== null}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {loadingAction === "deactivate" ? "Processing..." : "Deactivate"}
            </button>
          )}
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      )}
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
  const [loadingMap, setLoadingMap] = useState<Record<string, string | null>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  const activeOffer = offers.find((o) => o.status === "current_hired") ?? null;
  const historyOffers = offers.filter((o) => o.status !== "current_hired");

  function handleOfferUpdate(offerId: string, newStatus: string) {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.offerId === offerId) {
          return {
            ...o,
            status: newStatus,
            deactivatedAt: newStatus === "inactive" ? new Date().toISOString() as unknown as Date : o.deactivatedAt,
          };
        }
        if (newStatus === "current_hired") {
          if (o.status === "current_hired") return { ...o, status: "inactive", deactivatedAt: new Date().toISOString() as unknown as Date };
          if (o.status === "pending") return { ...o, status: "not_selected" };
        }
        return o;
      }),
    );
  }

  async function handleAction(offerId: string, action: "verify" | "unverifiable" | "deactivate") {
    setLoadingMap((prev) => ({ ...prev, [offerId]: action }));
    setErrorMap((prev) => ({ ...prev, [offerId]: "" }));

    const urlMap = {
      verify: `/api/admin/hired/offers/${offerId}/verify`,
      unverifiable: `/api/admin/hired/offers/${offerId}/mark-unverifiable`,
      deactivate: `/api/admin/hired/offers/${offerId}/admin-deactivate`,
    };

    try {
      const res = await fetch(urlMap[action], { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { offer: { status: string } };
      handleOfferUpdate(offerId, data.offer.status);
    } catch {
      setErrorMap((prev) => ({ ...prev, [offerId]: "Request failed" }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [offerId]: null }));
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Profile Header ── */}
      <ProfileHeader
        userName={profile.userName}
        userEmail={profile.userEmail}
        userCategory={profile.userCategory}
        onBack={() => router.push("/admin/hired-rate")}
      />

      {/* ── Active Offer Section ── */}
      {activeOffer ? (
        <ActiveOfferSection
          offer={activeOffer}
          onAction={(offerId) => handleAction(offerId, "deactivate")}
          loading={loadingMap[activeOffer.offerId] === "deactivate"}
          error={errorMap[activeOffer.offerId] ?? ""}
        />
      ) : (
        <section className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-900/50">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No active position
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Verify a pending offer below to set as current position.
          </p>
        </section>
      )}

      {/* ── History Section (scrollable) ── */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Offer History ({historyOffers.length})
        </h2>
        {historyOffers.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No other offers on record.</p>
        ) : (
          <div className="max-h-[480px] overflow-y-auto rounded-lg border border-gray-100 pr-1 dark:border-gray-800">
            <div className="space-y-3 p-1">
              {historyOffers.map((offer) => (
                <HistoryOfferCard
                  key={offer.offerId}
                  offer={offer}
                  onAction={handleAction}
                  loadingAction={loadingMap[offer.offerId] ?? null}
                  error={errorMap[offer.offerId] ?? ""}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Notes Section ── */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <NotesEditor
          profileId={profile.profileId}
          initialNotes={profile.notes}
        />
      </section>
    </div>
  );
}
