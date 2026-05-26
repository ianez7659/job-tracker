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

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Overview",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Students",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/applications",
    label: "Applications",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" />
      </svg>
    ),
  },
  {
    href: "/admin/rankings",
    label: "Rankings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
] as const;

// Shared item class
const ITEM_CLASS =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 aria-selected:bg-indigo-50 aria-selected:text-indigo-700 dark:text-gray-200 dark:aria-selected:bg-gray-800 dark:aria-selected:text-white";

// Group heading class
function GroupHeading({ label }: { label: string }) {
  return (
    <span className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
      {label}
    </span>
  );
}

export default function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ users: [], applications: [] });
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync dark mode state
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

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

  function exportCsv(path: string) {
    close();
    window.location.href = path;
  }

  function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    close();
  }

  if (!open) return null;

  const isSearching = query.trim().length >= 2;
  const hasResults = results.users.length > 0 || results.applications.length > 0;

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
              placeholder="Search or jump to…"
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

          <Command.List className="max-h-96 overflow-y-auto p-2">

            {/* ── Default state: no query ── */}
            {!isSearching && (
              <>
                {/* Pages */}
                <Command.Group heading={<GroupHeading label="Pages" />}>
                  {NAV_ITEMS.map(({ href, label, icon }) => (
                    <Command.Item
                      key={href}
                      value={`nav-${href}`}
                      onSelect={() => navigateTo(href)}
                      className={ITEM_CLASS}
                    >
                      <span className="shrink-0 text-gray-400">{icon}</span>
                      {label}
                    </Command.Item>
                  ))}
                </Command.Group>

                {/* Actions */}
                <Command.Group heading={<GroupHeading label="Actions" />}>
                  <Command.Item
                    value="action-export-users"
                    onSelect={() => exportCsv("/api/admin/export/users")}
                    className={ITEM_CLASS}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    Export Students CSV
                  </Command.Item>

                  <Command.Item
                    value="action-export-applications"
                    onSelect={() => exportCsv("/api/admin/export/applications")}
                    className={ITEM_CLASS}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    Export Applications CSV
                  </Command.Item>

                  <Command.Item
                    value="action-toggle-theme"
                    onSelect={toggleTheme}
                    className={ITEM_CLASS}
                  >
                    {isDark ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400">
                        <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                      </svg>
                    )}
                    {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  </Command.Item>
                </Command.Group>
              </>
            )}

            {/* ── Search state: query >= 2 chars ── */}
            {isSearching && !loading && !hasResults && (
              <Command.Empty>
                <p className="px-3 py-6 text-center text-xs text-gray-400">
                  No results for &ldquo;{query}&rdquo;
                </p>
              </Command.Empty>
            )}

            {/* Students group */}
            {results.users.length > 0 && (
              <Command.Group heading={<GroupHeading label="Students" />}>
                {results.users.map((u) => (
                  <Command.Item
                    key={u.id}
                    value={`user-${u.id}`}
                    onSelect={() => navigateTo(`/admin/users/${u.id}`)}
                    className={ITEM_CLASS}
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
              <Command.Group heading={<GroupHeading label="Applications" />}>
                {results.applications.map((a) => (
                  <Command.Item
                    key={a.jobId}
                    value={`app-${a.jobId}`}
                    onSelect={() => navigateTo(`/admin/users/${a.userId}`)}
                    className={ITEM_CLASS}
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
              select
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
