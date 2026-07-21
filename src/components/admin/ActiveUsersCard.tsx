"use client";

import { useState } from "react";
import Link from "next/link";
import type { ActiveUserPreview, CategoryCount } from "@/domains/admin/types";
import UserAvatar from "@/components/admin/UserAvatar";

const TRACK_CAP = 3;

type Props = {
  currentlyActiveUsers: number;
  totalStudents: number;
  topActiveUsers: ActiveUserPreview[];
  activeCategoryDistribution: CategoryCount[];
};

export default function ActiveUsersCard({
  currentlyActiveUsers,
  totalStudents,
  topActiveUsers,
  activeCategoryDistribution,
}: Props) {
  const [view, setView] = useState<"users" | "track">("users");

  const activePct =
    totalStudents > 0
      ? Math.round((currentlyActiveUsers / totalStudents) * 100)
      : 0;

  const maxCount = activeCategoryDistribution[0]?.count ?? 1;
  const visibleTracks = activeCategoryDistribution.slice(0, TRACK_CAP);
  const hiddenCount = activeCategoryDistribution.length - TRACK_CAP;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium uppercase tracking-wider text-gray-600 dark:text-gray-200">
            Currently Active Users
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Active in the last 3 days
          </p>
        </div>
        {/* Header toggle */}
        <div className="flex shrink-0 rounded-md border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setView("users")}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              view === "users"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Users
          </button>
          <button
            type="button"
            onClick={() => setView("track")}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              view === "track"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            By Track
          </button>
        </div>
      </div>

      {/* Stat */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="font-mono text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {currentlyActiveUsers}
            <span className="text-lg font-normal text-gray-400 dark:text-gray-500">
              {" "}/ {totalStudents}
            </span>
          </p>
          <p className="text-xs text-gray-500">students</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {activePct}%
          </p>
          <p className="text-xs text-gray-500">of total students</p>
        </div>
      </div>

      {/* Content — Users view */}
      {view === "users" && (
        <>
          {topActiveUsers.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
              No active users in the last 3 days
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
              {topActiveUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-2 py-2">
                  <UserAvatar name={u.name} email={u.email} />
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="min-w-0 flex-1 truncate text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                  >
                    {u.name ?? u.email}
                  </Link>
                  <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    Active
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Content — By Track view */}
      {view === "track" && (
        <div className="mt-4">
          {activeCategoryDistribution.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No active users in the last 3 days
            </p>
          ) : (
            <ul className="space-y-2">
              {visibleTracks.map((t) => (
                <li key={t.category} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 truncate text-xs text-gray-600 dark:text-gray-400">
                    {t.label}
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" style={{ height: "6px" }}>
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.round((t.count / maxCount) * 100)}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t.count}
                  </span>
                </li>
              ))}
              {hiddenCount > 0 && (
                <li className="text-xs text-gray-400 dark:text-gray-500">
                  +{hiddenCount} more
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* View all */}
      <div className="mt-3 text-right">
        <Link
          href="/admin/users"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          View all →
        </Link>
      </div>
    </div>
  );
}
