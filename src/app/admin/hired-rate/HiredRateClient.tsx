"use client";

import { useState, useMemo } from "react";
import type { HiredRateStats, HiredOfferRow } from "@/domains/admin/hiredRate";
import { EMPLOYMENT_TYPES, WORK_ARRANGEMENTS, SALARY_RANGES } from "@/domains/hired/constants";

// ── Label maps ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  current_hired: "Current Hired",
  inactive: "Inactive",
  not_selected: "Not Selected",
  unverifiable: "Unverifiable",
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
};

const WORK_LABELS: Record<string, string> = {
  on_site: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

const SALARY_LABELS: Record<string, string> = {
  not_disclosed: "Not Disclosed",
  under_40k: "Under $40k",
  "40k_50k": "$40k–$50k",
  "50k_60k": "$50k–$60k",
  "60k_70k": "$60k–$70k",
  "70k_80k": "$70k–$80k",
  "80k_plus": "$80k+",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-400",
  current_hired: "bg-emerald-500",
  inactive: "bg-gray-400",
  not_selected: "bg-red-400",
  unverifiable: "bg-orange-400",
};

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

// ── Distribution Bar ──────────────────────────────────────────────────────────

function DistributionBar({
  title,
  items,
  total,
}: {
  title: string;
  items: { key: string; label: string; count: number }[];
  total: number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">No data</p>
      ) : (
        <ul className="space-y-2">
          {items.map(({ key, label, count }) => (
            <li key={key} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-gray-600 dark:text-gray-400">
                {label}
              </span>
              <div className="flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-2 rounded-full bg-indigo-500 transition-all"
                  style={{ width: total > 0 ? `${Math.round((count / total) * 100)}%` : "0%" }}
                />
              </div>
              <span className="w-8 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                {count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────

interface Props {
  stats: HiredRateStats;
  rows: HiredOfferRow[];
}

export default function HiredRateClient({ stats, rows }: Props) {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEmployment, setFilterEmployment] = useState("");
  const [filterWork, setFilterWork] = useState("");

  // KPI values
  const verified = stats.byStatus["current_hired"] ?? 0;
  const pending = stats.byStatus["pending"] ?? 0;
  const inactive = stats.byStatus["inactive"] ?? 0;

  // Distribution items
  const statusItems = Object.entries(stats.byStatus).map(([key, count]) => ({
    key,
    label: STATUS_LABELS[key] ?? key,
    count,
  }));

  const salaryItems = SALARY_RANGES.map((key) => ({
    key,
    label: SALARY_LABELS[key] ?? key,
    count: stats.bySalaryRange[key] ?? 0,
  })).filter((i) => i.count > 0);

  const employmentItems = EMPLOYMENT_TYPES.map((key) => ({
    key,
    label: EMPLOYMENT_LABELS[key] ?? key,
    count: stats.byEmploymentType[key] ?? 0,
  })).filter((i) => i.count > 0);

  const workItems = WORK_ARRANGEMENTS.map((key) => ({
    key,
    label: WORK_LABELS[key] ?? key,
    count: stats.byWorkArrangement[key] ?? 0,
  })).filter((i) => i.count > 0);

  // Client-side filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterEmployment && r.employmentType !== filterEmployment) return false;
      if (filterWork && r.workArrangement !== filterWork) return false;
      return true;
    });
  }, [rows, filterStatus, filterEmployment, filterWork]);

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Total Offers" value={stats.total} />
        <KpiCard label="Current Hired" value={verified} sub="verified" />
        <KpiCard label="Pending" value={pending} sub="awaiting verification" />
        <KpiCard label="Inactive" value={inactive} sub="deactivated" />
      </div>

      {/* ── Distribution Bars ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DistributionBar title="By Status" items={statusItems} total={stats.total} />
        <DistributionBar title="Salary Range" items={salaryItems} total={stats.total} />
        <DistributionBar title="Employment Type" items={employmentItems} total={stats.total} />
        <DistributionBar title="Work Arrangement" items={workItems} total={stats.total} />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
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

        <select
          value={filterEmployment}
          onChange={(e) => setFilterEmployment(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          <option value="">All employment types</option>
          {EMPLOYMENT_TYPES.map((val) => (
            <option key={val} value={val}>{EMPLOYMENT_LABELS[val]}</option>
          ))}
        </select>

        <select
          value={filterWork}
          onChange={(e) => setFilterWork(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          <option value="">All work arrangements</option>
          {WORK_ARRANGEMENTS.map((val) => (
            <option key={val} value={val}>{WORK_LABELS[val]}</option>
          ))}
        </select>

        {(filterStatus || filterEmployment || filterWork) && (
          <button
            onClick={() => {
              setFilterStatus("");
              setFilterEmployment("");
              setFilterWork("");
            }}
            className="rounded-md px-3 py-1.5 text-sm text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto self-center text-sm text-gray-400">
          {filteredRows.length} / {rows.length} offers
        </span>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Company / Role</th>
              <th className="px-4 py-3">Offer Date</th>
              <th className="px-4 py-3">Employment</th>
              <th className="px-4 py-3">Arrangement</th>
              <th className="px-4 py-3">Salary</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No offers found.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.offerId}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {row.userName ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400">{row.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{row.company}</p>
                    <p className="text-xs text-gray-400">{row.title}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {row.offerDate ? new Date(row.offerDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {row.employmentType ? (EMPLOYMENT_LABELS[row.employmentType] ?? row.employmentType) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {row.workArrangement ? (WORK_LABELS[row.workArrangement] ?? row.workArrangement) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {row.salaryRange ? (SALARY_LABELS[row.salaryRange] ?? row.salaryRange) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white",
                        STATUS_COLORS[row.status] ?? "bg-gray-400",
                      ].join(" ")}
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {row.verifiedAt ? new Date(row.verifiedAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
