"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { HubStatus } from "@/domains/admin/types";

const OPTIONS: { value: NonNullable<HubStatus>; label: string }[] = [
  { value: "STUDENT", label: "Student" },
  { value: "ALUMNI", label: "Alumni" },
  { value: "STAFF", label: "Staff" },
];

interface UserRoleDropdownProps {
  userId: string;
  current: HubStatus;
  isSelf: boolean;
}

export default function UserRoleDropdown({
  userId,
  current,
  isSelf,
}: UserRoleDropdownProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(current ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const hubStatus = e.target.value as NonNullable<HubStatus>;
    const prev = selected;
    setSelected(hubStatus);
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hubStatus }),
    });

    setLoading(false);

    if (!res.ok) {
      setSelected(prev);
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? "Failed to update role");
      return;
    }

    router.refresh();
  }

  if (isSelf) {
    return (
      <span className="text-xs text-gray-500 italic">You</span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative flex items-center gap-1.5">
        <select
          value={selected}
          onChange={handleChange}
          disabled={loading}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          {!current && (
            <option value="" disabled>
              — not set —
            </option>
          )}
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {loading && (
          <svg
            className="h-3.5 w-3.5 animate-spin text-indigo-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
