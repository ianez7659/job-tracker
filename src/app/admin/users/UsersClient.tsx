"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { getCategoryLabel, USER_CATEGORIES } from "@/lib/constants/categories";
import UserRoleDropdown from "./UserRoleDropdown";
import type { DetailedAdminUser, EmploymentStatus, HubStatus } from "@/domains/admin/types";

const EMPLOYMENT_BADGE: Record<EmploymentStatus, { label: string; className: string }> = {
  hired: {
    label: "Hired",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700/50",
  },
  active: {
    label: "Active",
    className: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-700/50",
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-500 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700",
  },
};

const HUB_STATUS_LABELS: Record<string, string> = {
  STUDENT: "Student",
  ALUMNI: "Alumni",
  STAFF: "Staff",
};

function EmploymentBadge({ status }: { status: EmploymentStatus }) {
  const { label, className } = EMPLOYMENT_BADGE[status];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
      {label}
    </span>
  );
}

function HubBadge({ status }: { status: HubStatus }) {
  if (!status) return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
  const cls =
    status === "STAFF"
      ? "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/40 dark:text-purple-300 dark:ring-purple-700/50"
      : status === "ALUMNI"
      ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700/50"
      : "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-700/50";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {HUB_STATUS_LABELS[status]}
    </span>
  );
}

// ── Sort ──────────────────────────────────────────────────────────────────────

type SortKey = "total" | "xp" | "lastActive" | "streak";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`ml-1 inline-block transition-opacity ${active ? "opacity-100" : "opacity-30"}`}
    >
      {active && dir === "asc" ? (
        <path d="M12 19V5M5 12l7-7 7 7" />
      ) : (
        <path d="M12 5v14M5 12l7 7 7-7" />
      )}
    </svg>
  );
}

function SortableTh({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey | null;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  return (
    <th
      className={`cursor-pointer select-none px-4 py-3 hover:text-gray-700 dark:hover:text-gray-300 ${className ?? ""}`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <SortIcon active={current === sortKey} dir={dir} />
    </th>
  );
}

// ── Filter options ────────────────────────────────────────────────────────────

const TRACK_OPTIONS = [
  { value: "", label: "All Tracks" },
  ...USER_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
  { value: "__not_set__", label: "Not set" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "hired", label: "Hired" },
  { value: "inactive", label: "Inactive" },
];

const HUB_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Roles" },
  { value: "STUDENT", label: "Student" },
  { value: "ALUMNI", label: "Alumni" },
  { value: "STAFF", label: "Staff" },
  { value: "__null__", label: "Not set" },
];

interface Props {
  users: DetailedAdminUser[];
  currentUserId: string | null;
}

const SELECT_CLS = "rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300";

export default function UsersClient({ users, currentUserId }: Props) {
  const [query, setQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [hubFilter, setHubFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter((u) => {
      if (q) {
        const name = (u.name ?? "").toLowerCase();
        const email = u.email.toLowerCase();
        const track = getCategoryLabel(u.category).toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !track.includes(q)) return false;
      }
      if (trackFilter) {
        if (trackFilter === "__not_set__") {
          if (u.category) return false;
        } else {
          if (u.category !== trackFilter) return false;
        }
      }
      if (statusFilter && u.employmentStatus !== statusFilter) return false;
      if (hubFilter) {
        if (hubFilter === "__null__") {
          if (u.hubStatus !== null) return false;
        } else {
          if (u.hubStatus !== hubFilter) return false;
        }
      }
      return true;
    });
  }, [users, query, trackFilter, statusFilter, hubFilter]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let av = 0, bv = 0;
      if (sortKey === "total")      { av = a.jobCounts.total; bv = b.jobCounts.total; }
      if (sortKey === "xp")         { av = a.totalXp; bv = b.totalXp; }
      if (sortKey === "lastActive") { av = a.lastActiveAt?.getTime() ?? 0; bv = b.lastActiveAt?.getTime() ?? 0; }
      if (sortKey === "streak")     { av = a.loginStreak; bv = b.loginStreak; }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <svg className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or track..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500"
          />
        </div>
        <select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)} className={SELECT_CLS}>
          {TRACK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={SELECT_CLS}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={hubFilter} onChange={(e) => setHubFilter(e.target.value)} className={SELECT_CLS}>
          {HUB_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="ml-auto shrink-0 text-xs text-gray-500 dark:text-gray-400">
          Showing {filtered.length} of {users.length} users
        </span>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center dark:border-gray-800 dark:bg-gray-900">
          <svg className="mx-auto mb-3 text-gray-300 dark:text-gray-600" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <p className="text-sm text-gray-400 dark:text-gray-500">No users match the current filters.</p>
          {(query || trackFilter || statusFilter || hubFilter) && (
            <button
              onClick={() => { setQuery(""); setTrackFilter(""); setStatusFilter(""); setHubFilter(""); }}
              className="mt-2 text-xs text-indigo-500 hover:text-indigo-400"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                <th className="px-4 py-3">Name / Email</th>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">Status</th>
                <SortableTh label="Total" sortKey="total" current={sortKey} dir={sortDir} onSort={handleSort} className="text-center" />
                <th className="px-4 py-3 text-center">Apply</th>
                <th className="px-4 py-3 text-center">Wait</th>
                <th className="px-4 py-3 text-center">Interview</th>
                <th className="px-4 py-3 text-center">Rejected</th>
                <th className="px-4 py-3 text-center">Offered</th>
                <SortableTh label="XP" sortKey="xp" current={sortKey} dir={sortDir} onSort={handleSort} className="text-center" />
                <th className="px-4 py-3 text-center">Lv</th>
                <SortableTh label="Streak" sortKey="streak" current={sortKey} dir={sortDir} onSort={handleSort} className="text-center" />
                <SortableTh label="Last Active" sortKey="lastActive" current={sortKey} dir={sortDir} onSort={handleSort} className="" />
                <th className="px-4 py-3">Hub Role</th>
                <th className="px-4 py-3">Change Role</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
              {sorted.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/60">
                  <td className="px-4 py-3">
                    <p className="whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                      {user.name ?? <span className="italic text-gray-400 dark:text-gray-500">—</span>}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                    {getCategoryLabel(user.category)}
                  </td>
                  <td className="px-4 py-3">
                    <EmploymentBadge status={user.employmentStatus} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{user.jobCounts.total}</td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">{user.jobCounts.applying}</td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">{user.jobCounts.waiting}</td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">{user.jobCounts.interview}</td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">{user.jobCounts.rejected}</td>
                  <td className="px-4 py-3 text-center">
                    {user.jobCounts.offered > 0 ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{user.jobCounts.offered}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{user.totalXp.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{user.currentLevel}</td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                    {user.loginStreak > 0 ? `${user.loginStreak}d` : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                    {user.lastActiveAt ? user.lastActiveAt.toLocaleDateString("en-CA") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <HubBadge status={user.hubStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleDropdown
                      userId={user.id}
                      current={user.hubStatus}
                      isSelf={user.id === currentUserId}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
