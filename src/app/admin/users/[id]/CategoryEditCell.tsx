"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCategoryLabel,
  getCategoriesGroupedByParent,
} from "@/lib/constants/categories";

interface Props {
  userId: string;
  current: string | null;
}

export default function CategoryEditCell({ userId, current }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const grouped = getCategoriesGroupedByParent();

  function cancel() {
    setEditing(false);
    setValue(current ?? "");
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: value || null }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Failed to save");
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {current ? (
            getCategoryLabel(current)
          ) : (
            <span className="text-gray-400 dark:text-gray-500">Not set</span>
          )}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-indigo-500 hover:text-indigo-400 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="">Not set</option>
          {grouped.map((group) => (
            <optgroup key={group.parentId} label={group.label}>
              {group.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={cancel}
          disabled={saving}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
