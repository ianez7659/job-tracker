"use client";

import { useState, useEffect, useCallback } from "react";
import type { ActivityLogEntry } from "@/domains/admin/activityLog";

// ── Constants ────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  offer_verified: "Verified Offer",
  offer_deactivated: "Deactivated Offer",
  offer_marked_unverifiable: "Marked Unverifiable",
  offer_details_updated: "Updated Offer Details",
  profile_notes_updated: "Updated Notes",
  user_role_changed: "Changed Role",
  user_category_changed: "Changed Category",
};

const ACTION_COLORS: Record<string, string> = {
  offer_verified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  offer_deactivated: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  offer_marked_unverifiable: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  offer_details_updated: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  profile_notes_updated: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  user_role_changed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  user_category_changed: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

const PER_PAGE = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function metadataSummary(action: string, metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "";
  const m = metadata as Record<string, unknown>;

  switch (action) {
    case "offer_verified":
    case "offer_deactivated":
    case "offer_marked_unverifiable":
      return [m.company, m.title].filter(Boolean).join(" — ") || "";
    case "offer_details_updated":
      return Object.keys(m).join(", ");
    case "user_role_changed":
      return m.newRole ? `→ ${m.newRole}` : "";
    case "user_category_changed":
      return m.newCategory ? `→ ${m.newCategory}` : "→ cleared";
    default:
      return "";
  }
}

// ── Component ────────────────────────────────────────────────────────────────

type LogResponse = {
  entries: ActivityLogEntry[];
  total: number;
};

export default function ActivityClient() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(total / PER_PAGE);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      params.set("page", String(page));
      params.set("perPage", String(PER_PAGE));

      const res = await fetch(`/api/admin/activity?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as LogResponse;
      setEntries(data.entries);
      setTotal(data.total);
    } catch {
      setEntries([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleFilterChange(action: string) {
    setActionFilter(action);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="">All Actions</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a]}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {total} {total === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No activity logs found.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {relativeTime(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      {entry.adminName ?? entry.adminEmail}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_COLORS[entry.action] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-800">
                      {entry.targetType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {metadataSummary(entry.action, entry.metadata)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
