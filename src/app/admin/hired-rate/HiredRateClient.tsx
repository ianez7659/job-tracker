"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { HiredRateStats, HiredOfferRow } from "@/domains/admin/hiredRate";
import { EMPLOYMENT_TYPES } from "@/domains/hired/constants";

const PAGE_SIZE = 10;

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

const EMPLOYMENT_BADGE_COLORS: Record<string, string> = {
  full_time:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  part_time:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  contract:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  internship:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  current_hired: "Verified",
  inactive: "Inactive",
  not_selected: "Not Selected",
  unverifiable: "Unverifiable",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  current_hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  inactive: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  not_selected: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  unverifiable: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
};

type BatchAction = "verify" | "deactivate" | "mark_unverifiable";

const BATCH_ACTION_LABELS: Record<BatchAction, string> = {
  verify: "Verify",
  deactivate: "Deactivate",
  mark_unverifiable: "Mark Unverifiable",
};

const BATCH_ACTION_COLORS: Record<BatchAction, string> = {
  verify: "bg-emerald-600 hover:bg-emerald-700 text-white",
  deactivate: "bg-gray-600 hover:bg-gray-700 text-white",
  mark_unverifiable: "bg-orange-600 hover:bg-orange-700 text-white",
};

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
        {sub && (
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconPeople() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconCalendarSm() {
  return (
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
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconExport() {
  return (
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
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg
      className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

// ── CSV Export ─────────────────────────────────────────────────────────────────

function exportToCSV(rows: HiredOfferRow[]) {
  const headers = [
    "Student Name",
    "Email",
    "Job Category",
    "Company",
    "Position",
    "Offer Date",
    "Employment Type",
  ];
  const csvRows = rows.map((r) => [
    r.userName ?? "",
    r.userEmail,
    r.userCategory ?? "",
    r.company,
    r.title,
    r.offerDate ? new Date(r.offerDate).toLocaleDateString() : "",
    r.employmentType
      ? (EMPLOYMENT_LABELS[r.employmentType] ?? r.employmentType)
      : "",
  ]);

  const content = [headers, ...csvRows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hired-rate-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Month helpers ──────────────────────────────────────────────────────────────

function toMonthString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthStr: string): string {
  const [y, m] = monthStr.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// ── Confirmation Dialog ────────────────────────────────────────────────────────

function ConfirmDialog({
  action,
  count,
  onConfirm,
  onCancel,
}: {
  action: BatchAction;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Confirm Batch Action
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to{" "}
          <span className="font-medium">{BATCH_ACTION_LABELS[action].toLowerCase()}</span>{" "}
          {count} {count === 1 ? "offer" : "offers"}?
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-sm font-medium ${BATCH_ACTION_COLORS[action]}`}
          >
            {BATCH_ACTION_LABELS[action]}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Result Toast ───────────────────────────────────────────────────────────────

function ResultToast({
  succeeded,
  failed,
  onClose,
}: {
  succeeded: number;
  failed: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-lg border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          {succeeded > 0 && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {succeeded} {succeeded === 1 ? "offer" : "offers"} updated successfully
            </p>
          )}
          {failed > 0 && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {failed} {failed === 1 ? "offer" : "offers"} failed
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────

interface Props {
  stats: HiredRateStats;
  rows: HiredOfferRow[];
}

export default function HiredRateClient({ stats, rows }: Props) {
  const router = useRouter();
  const now = new Date();

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(toMonthString(now));
  const [filterCategory, setFilterCategory] = useState("");
  const [filterEmployment, setFilterEmployment] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Bulk selection
  const [selectedOfferIds, setSelectedOfferIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<BatchAction | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [toastResult, setToastResult] = useState<{ succeeded: number; failed: number } | null>(null);

  // Unique filter options derived from data
  const categories = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.userCategory).filter(Boolean)),
      ).sort() as string[],
    [rows],
  );
  const companies = useMemo(
    () => Array.from(new Set(rows.map((r) => r.company))).sort(),
    [rows],
  );

  // Client-side filtered rows
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      if (filterCategory && r.userCategory !== filterCategory) return false;
      if (filterEmployment && r.employmentType !== filterEmployment) return false;
      if (filterCompany && r.company !== filterCompany) return false;
      if (q) {
        const name = (r.userName ?? "").toLowerCase();
        const email = r.userEmail.toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filterCategory, filterEmployment, filterCompany, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePageNum = Math.min(page, totalPages);
  const pageRows = filteredRows.slice(
    (safePageNum - 1) * PAGE_SIZE,
    safePageNum * PAGE_SIZE,
  );
  const startItem =
    filteredRows.length === 0 ? 0 : (safePageNum - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safePageNum * PAGE_SIZE, filteredRows.length);

  function handlePageChange(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  const hasFilters = !!(
    filterCategory ||
    filterEmployment ||
    filterCompany ||
    search
  );

  function clearFilters() {
    setFilterCategory("");
    setFilterEmployment("");
    setFilterCompany("");
    setSearch("");
    setPage(1);
  }

  // ── Selection helpers ─────────────────────────────────────────────────────

  const pageOfferIds = useMemo(() => pageRows.map((r) => r.offerId), [pageRows]);
  const allPageSelected = pageOfferIds.length > 0 && pageOfferIds.every((id) => selectedOfferIds.has(id));
  const somePageSelected = pageOfferIds.some((id) => selectedOfferIds.has(id));

  function toggleSelectAll() {
    setSelectedOfferIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageOfferIds.forEach((id) => next.delete(id));
      } else {
        pageOfferIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleSelect(offerId: string) {
    setSelectedOfferIds((prev) => {
      const next = new Set(prev);
      if (next.has(offerId)) {
        next.delete(offerId);
      } else {
        next.add(offerId);
      }
      return next;
    });
  }

  // ── Batch action execution ────────────────────────────────────────────────

  const executeBatchAction = useCallback(async (action: BatchAction) => {
    setBatchLoading(true);
    setConfirmAction(null);

    try {
      const res = await fetch("/api/admin/hired/offers/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          offerIds: Array.from(selectedOfferIds),
        }),
      });

      if (!res.ok) {
        setToastResult({ succeeded: 0, failed: selectedOfferIds.size });
        return;
      }

      const data = await res.json() as { succeeded: string[]; failed: { offerId: string; reason: string }[] };
      setToastResult({
        succeeded: data.succeeded.length,
        failed: data.failed.length,
      });
      setSelectedOfferIds(new Set());
      router.refresh();
    } catch {
      setToastResult({ succeeded: 0, failed: selectedOfferIds.size });
    } finally {
      setBatchLoading(false);
    }
  }, [selectedOfferIds, router]);

  return (
    <div className="space-y-6">
      {/* ── Top bar: month picker + Export CSV ── */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <IconCalendarSm />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setPage(1);
            }}
            className="border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
          />
        </div>
        <button
          onClick={() => exportToCSV(filteredRows)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <IconExport />
          Export CSV
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          icon={<IconPeople />}
          label="Active Hired"
          value={stats.activeHired}
          sub={`${stats.activeHiredRate}% of ${stats.totalUsers} users`}
        />
        <KpiCard
          icon={<IconBriefcase />}
          label="Cumulative Hired"
          value={stats.cumulativeHired}
          sub={`${stats.cumulativeHiredRate}% of ${stats.totalUsers} users`}
        />
        <KpiCard
          icon={<IconBuilding />}
          label="Companies"
          value={stats.uniqueCompanies}
          sub="Unique companies"
        />
        <KpiCard
          icon={<IconCalendar />}
          label="Offers This Month"
          value={stats.offersThisMonth}
          sub={monthLabel(selectedMonth)}
        />
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Job Category
          </label>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Employment Type
          </label>
          <select
            value={filterEmployment}
            onChange={(e) => {
              setFilterEmployment(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">All</option>
            {EMPLOYMENT_TYPES.map((val) => (
              <option key={val} value={val}>
                {EMPLOYMENT_LABELS[val]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Company
          </label>
          <select
            value={filterCompany}
            onChange={(e) => {
              setFilterCompany(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">All</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Search
          </label>
          <div className="relative">
            <IconSearch />
            <input
              type="text"
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-700 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:placeholder-gray-500"
            />
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="self-end rounded-md px-3 py-1.5 text-sm text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <tr>
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                  aria-label="Select all on page"
                />
              </th>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Job Category</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Offer Date</th>
              <th className="px-4 py-3">Employment Type</th>
              <th className="px-4 py-3">Offers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    No offer records yet
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Students appear here when their job status is set to offer.
                  </p>
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const isSelected = selectedOfferIds.has(row.offerId);
                return (
                  <tr
                    key={row.offerId}
                    className={[
                      "transition-colors",
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                    ].join(" ")}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(row.offerId);
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                        aria-label={`Select ${row.userName ?? row.userEmail}`}
                      />
                    </td>

                    {/* Student Name */}
                    <td
                      className="cursor-pointer px-4 py-3"
                      onClick={() => router.push(`/admin/hired-pool/${row.profileId}`)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                          {(row.userName ?? row.userEmail).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {row.userName ?? "\u2014"}
                          </p>
                          <p className="truncate text-xs text-gray-400">
                            {row.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          STATUS_COLORS[row.status] ?? STATUS_COLORS.inactive,
                        ].join(" ")}
                      >
                        {STATUS_LABELS[row.status] ?? row.status}
                      </span>
                    </td>

                    {/* Job Category */}
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {row.userCategory ?? "\u2014"}
                    </td>

                    {/* Company */}
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {row.company}
                    </td>

                    {/* Position */}
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {row.title}
                    </td>

                    {/* Offer Date */}
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {row.offerDate
                        ? new Date(row.offerDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "\u2014"}
                    </td>

                    {/* Employment Type */}
                    <td className="px-4 py-3">
                      {row.employmentType ? (
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            EMPLOYMENT_BADGE_COLORS[row.employmentType] ??
                              "bg-gray-100 text-gray-700",
                          ].join(" ")}
                        >
                          {EMPLOYMENT_LABELS[row.employmentType] ?? row.employmentType}
                        </span>
                      ) : (
                        <span className="text-gray-400">{"\u2014"}</span>
                      )}
                    </td>

                    {/* Offers count */}
                    <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                      {row.offerCount}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          {filteredRows.length === 0
            ? "No results"
            : `Showing ${startItem} to ${endItem} of ${filteredRows.length} results`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(safePageNum - 1)}
            disabled={safePageNum <= 1}
            className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
            aria-label="Previous page"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={[
                "rounded px-2.5 py-1 text-sm font-medium",
                p === safePageNum
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800",
              ].join(" ")}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(safePageNum + 1)}
            disabled={safePageNum >= totalPages}
            className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* ── Floating Action Bar ── */}
      {selectedOfferIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedOfferIds.size} selected
          </span>
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
          {(Object.keys(BATCH_ACTION_LABELS) as BatchAction[]).map((action) => (
            <button
              key={action}
              disabled={batchLoading}
              onClick={() => setConfirmAction(action)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${BATCH_ACTION_COLORS[action]}`}
            >
              {BATCH_ACTION_LABELS[action]}
            </button>
          ))}
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={() => setSelectedOfferIds(new Set())}
            className="text-xs text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      {confirmAction && (
        <ConfirmDialog
          action={confirmAction}
          count={selectedOfferIds.size}
          onConfirm={() => executeBatchAction(confirmAction)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* ── Result Toast ── */}
      {toastResult && (
        <ResultToast
          succeeded={toastResult.succeeded}
          failed={toastResult.failed}
          onClose={() => setToastResult(null)}
        />
      )}
    </div>
  );
}
