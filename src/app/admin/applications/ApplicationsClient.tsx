"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { getCategoryLabel, USER_CATEGORIES } from "@/lib/constants/categories";
import type { AdminApplication } from "@/domains/admin/types";

const STATUS_STYLES: Record<string, string> = {
  applying:   "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-700/50",
  resume:     "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-indigo-700/50",
  interview1: "bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/40 dark:text-yellow-300 dark:ring-yellow-700/50",
  interview2: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/40 dark:text-orange-300 dark:ring-orange-700/50",
  interview3: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700/50",
  offer:      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700/50",
  rejected:   "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-700/50",
};

const STATUS_LABELS: Record<string, string> = {
  applying: "Applying",
  resume: "Waiting",
  interview1: "Interview 1",
  interview2: "Interview 2",
  interview3: "Interview 3",
  offer: "Offered",
  rejected: "Rejected",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "applying", label: "Applying" },
  { value: "resume", label: "Waiting" },
  { value: "interview1", label: "Interview 1" },
  { value: "interview2", label: "Interview 2" },
  { value: "interview3", label: "Interview 3" },
  { value: "offer", label: "Offered" },
  { value: "rejected", label: "Rejected" },
];

const TRACK_OPTIONS = [
  { value: "", label: "All Tracks" },
  ...USER_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
  { value: "__not_set__", label: "Not set" },
];

interface Props {
  applications: AdminApplication[];
}

const SELECT_CLS = "rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300";

export default function ApplicationsClient({ applications }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return applications.filter((a) => {
      if (q) {
        const company = a.company.toLowerCase();
        const title = a.title.toLowerCase();
        const user = (a.userName ?? "").toLowerCase();
        const email = a.userEmail.toLowerCase();
        if (!company.includes(q) && !title.includes(q) && !user.includes(q) && !email.includes(q)) return false;
      }
      if (statusFilter && a.status !== statusFilter) return false;
      if (trackFilter) {
        if (trackFilter === "__not_set__") {
          if (a.userCategory) return false;
        } else {
          if (a.userCategory !== trackFilter) return false;
        }
      }
      return true;
    });
  }, [applications, query, statusFilter, trackFilter]);

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
            placeholder="Search by company, title, or user..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={SELECT_CLS}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)} className={SELECT_CLS}>
          {TRACK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="ml-auto shrink-0 text-xs text-gray-500 dark:text-gray-400">
          Showing {filtered.length} of {applications.length} applications
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-400 dark:text-gray-500">No applications match the current filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Company / Title</th>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-center">URL</th>
                <th className="px-4 py-3 text-center">JD</th>
                <th className="px-4 py-3 text-center">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
              {filtered.map((app) => (
                <tr key={app.jobId} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${app.userId}`} className="whitespace-nowrap font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                      {app.userName ?? <span className="italic">—</span>}
                    </Link>
                    <p className="text-xs text-gray-500">{app.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{app.company}</p>
                    <p className="whitespace-nowrap text-xs text-gray-500">{app.title}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                    {getCategoryLabel(app.userCategory)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                    {app.appliedAt.toLocaleDateString("en-CA")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                    {app.updatedAt.toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {app.hasUrl ? <span className="text-emerald-600 dark:text-emerald-400">✓</span> : <span className="text-gray-300 dark:text-gray-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {app.hasJd ? <span className="text-emerald-600 dark:text-emerald-400">✓</span> : <span className="text-gray-300 dark:text-gray-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {app.hasNotes ? <span className="text-emerald-600 dark:text-emerald-400">✓</span> : <span className="text-gray-300 dark:text-gray-700">—</span>}
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
