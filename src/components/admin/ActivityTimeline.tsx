"use client";

import { useState, useEffect } from "react";
import type { ActivityLogEntry } from "@/domains/admin/activityLog";

const ACTION_LABELS: Record<string, string> = {
  offer_verified: "Verified offer",
  offer_deactivated: "Deactivated offer",
  offer_marked_unverifiable: "Marked unverifiable",
  offer_details_updated: "Updated offer details",
  profile_notes_updated: "Updated notes",
  user_role_changed: "Changed role",
  user_category_changed: "Changed category",
};

const ACTION_DOT_COLORS: Record<string, string> = {
  offer_verified: "bg-emerald-500",
  offer_deactivated: "bg-gray-400",
  offer_marked_unverifiable: "bg-orange-500",
  offer_details_updated: "bg-blue-500",
  profile_notes_updated: "bg-indigo-500",
  user_role_changed: "bg-purple-500",
  user_category_changed: "bg-amber-500",
};

function relativeTime(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function metadataHint(action: string, metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "";
  const m = metadata as Record<string, unknown>;
  if (action === "user_role_changed" && m.newRole) return `→ ${m.newRole}`;
  if (action === "user_category_changed") return m.newCategory ? `→ ${m.newCategory}` : "→ cleared";
  if (action === "offer_details_updated") return Object.keys(m).join(", ");
  return [m.company, m.title].filter(Boolean).join(" — ");
}

const INITIAL_SHOW = 5;

interface Props {
  targetType: string;
  targetId: string;
}

export default function ActivityTimeline({ targetType, targetId }: Props) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams({
          targetType,
          targetId,
          perPage: "50",
        });
        const res = await fetch(`/api/admin/activity?${params}`);
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as { entries: ActivityLogEntry[]; total: number };
        setEntries(data.entries);
        setTotal(data.total);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [targetType, targetId]);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-xs text-gray-400">Loading activity...</p>
      </div>
    );
  }

  if (entries.length === 0) return null;

  const visible = showAll ? entries : entries.slice(0, INITIAL_SHOW);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Activity ({total})
      </h3>

      <ol className="space-y-2">
        {visible.map((entry) => (
          <li key={entry.id} className="flex items-start gap-2.5">
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ACTION_DOT_COLORS[entry.action] ?? "bg-gray-400"}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-700 dark:text-gray-300">
                <span className="font-medium">{entry.adminName ?? entry.adminEmail}</span>
                {" "}
                {ACTION_LABELS[entry.action] ?? entry.action}
                {metadataHint(entry.action, entry.metadata) && (
                  <span className="text-gray-400 dark:text-gray-500">
                    {" "}{metadataHint(entry.action, entry.metadata)}
                  </span>
                )}
              </p>
            </div>
            <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
              {relativeTime(entry.createdAt)}
            </span>
          </li>
        ))}
      </ol>

      {!showAll && entries.length > INITIAL_SHOW && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Show more ({entries.length - INITIAL_SHOW} more)
        </button>
      )}
    </div>
  );
}
