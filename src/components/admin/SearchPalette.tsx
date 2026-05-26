"use client";

import { useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";

interface UserResult {
  id: string;
  name: string | null;
  email: string;
  category: string | null;
  hubStatus: string | null;
}

interface ApplicationResult {
  jobId: string;
  title: string;
  company: string;
  status: string;
  userId: string;
  userName: string | null;
  userEmail: string;
}

interface SearchResults {
  users: UserResult[];
  applications: ApplicationResult[];
}

const STATUS_LABELS: Record<string, string> = {
  applying: "Applying",
  resume: "Waiting",
  interview1: "Interview 1",
  interview2: "Interview 2",
  interview3: "Interview 3",
  offer: "Offered",
  rejected: "Rejected",
};

export default function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ users: [], applications: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Custom event from sidebar search button
  useEffect(() => {
    function onOpenSearch() {
      setOpen(true);
    }
    document.addEventListener("open-search", onOpenSearch);
    return () => document.removeEventListener("open-search", onOpenSearch);
  }, []);

  // Debounced search fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults({ users: [], applications: [] });
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function close() {
    setOpen(false);
    setQuery("");
    setResults({ users: [], applications: [] });
  }

  function navigateTo(href: string) {
    close();
    router.push(href);
  }

  if (!open) return null;

  const hasResults =
    results.users.length > 0 || results.applications.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <Command shouldFilter={false} loop>
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-gray-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search students or applications…"
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-gray-100 dark:placeholder-gray-500"
            />
            {loading && (
              <svg
                className="h-4 w-4 animate-spin text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            <kbd className="hidden rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-700 sm:block">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            {query.trim().length < 2 && (
              <Command.Empty>
                <p className="px-3 py-6 text-center text-xs text-gray-400">
                  Type at least 2 characters to search
                </p>
              </Command.Empty>
            )}

            {query.trim().length >= 2 && !loading && !hasResults && (
              <Command.Empty>
                <p className="px-3 py-6 text-center text-xs text-gray-400">
                  No results for &ldquo;{query}&rdquo;
                </p>
              </Command.Empty>
            )}

            {/* Students group */}
            {results.users.length > 0 && (
              <Command.Group
                heading={
                  <span className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Students
                  </span>
                }
              >
                {results.users.map((u) => (
                  <Command.Item
                    key={u.id}
                    value={`user-${u.id}`}
                    onSelect={() => navigateTo(`/admin/users/${u.id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 aria-selected:bg-indigo-50 aria-selected:text-indigo-700 dark:text-gray-200 dark:aria-selected:bg-gray-800 dark:aria-selected:text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-gray-400"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M20 21a8 8 0 1 0-16 0" />
                    </svg>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {u.name ?? u.email}
                      </p>
                      {u.name && (
                        <p className="truncate text-xs text-gray-400">
                          {u.email}
                        </p>
                      )}
                    </div>
                    {u.category && (
                      <span className="ml-auto shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {u.category}
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Applications group */}
            {results.applications.length > 0 && (
              <Command.Group
                heading={
                  <span className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Applications
                  </span>
                }
              >
                {results.applications.map((a) => (
                  <Command.Item
                    key={a.jobId}
                    value={`app-${a.jobId}`}
                    onSelect={() => navigateTo(`/admin/users/${a.userId}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 aria-selected:bg-indigo-50 aria-selected:text-indigo-700 dark:text-gray-200 dark:aria-selected:bg-gray-800 dark:aria-selected:text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-gray-400"
                    >
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    </svg>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {a.title}{" "}
                        <span className="font-normal text-gray-400">
                          @ {a.company}
                        </span>
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        {a.userName ?? a.userEmail}
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer hint */}
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 dark:border-gray-800">
            <span className="text-[10px] text-gray-400">
              <kbd className="rounded border border-gray-200 px-1 py-0.5 dark:border-gray-700">↑</kbd>{" "}
              <kbd className="rounded border border-gray-200 px-1 py-0.5 dark:border-gray-700">↓</kbd>{" "}
              navigate
            </span>
            <span className="text-[10px] text-gray-400">
              <kbd className="rounded border border-gray-200 px-1 py-0.5 dark:border-gray-700">↵</kbd>{" "}
              open
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
