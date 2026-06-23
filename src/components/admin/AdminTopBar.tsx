"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: string;
  message: string;
  profileId: string | null;
  offerId: string | null;
  createdAt: string;
  isRead: boolean;
}

// ── Polling Hook ─────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 10_000;

function useNotificationCount() {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/unread-count");
      if (!res.ok) return;
      const data = (await res.json()) as { count: number };
      const newCount = data.count;

      // Detect increase for toast
      if (newCount > prevCountRef.current && prevCountRef.current >= 0) {
        setHasNewNotification(true);
      }
      prevCountRef.current = newCount;
      setCount(newCount);
    } catch {
      // Silently ignore network errors during polling
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchCount();

    // Polling with Page Visibility API
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function startPolling() {
      if (intervalId) return;
      intervalId = setInterval(fetchCount, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchCount();
        startPolling();
      }
    }

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchCount]);

  const dismissNewNotification = useCallback(() => {
    setHasNewNotification(false);
  }, []);

  const resetCount = useCallback(() => {
    setCount(0);
    prevCountRef.current = 0;
  }, []);

  return { count, hasNewNotification, dismissNewNotification, resetCount };
}

// ── Toast Component ──────────────────────────────────────────────────────────

function NotificationToast({
  onDismiss,
  onClick,
}: {
  onDismiss: () => void;
  onClick: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.2 }}
      className="fixed top-4 right-4 z-[60] max-w-sm cursor-pointer rounded-lg bg-indigo-600 px-4 py-3 text-sm text-white shadow-lg dark:bg-indigo-500"
      onClick={onClick}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <Bell size={14} />
        <span className="font-medium">New offer submitted</span>
      </div>
      <p className="mt-1 text-xs text-indigo-100">Click to view in Hired Rate</p>
    </motion.div>
  );
}

// ── Notification Panel ───────────────────────────────────────────────────────

function NotificationPanel({
  notifications,
  onItemClick,
}: {
  notifications: Notification[];
  onItemClick: (n: Notification) => void;
}) {
  if (notifications.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No new notifications
      </div>
    );
  }

  return (
    <ul className="max-h-80 overflow-y-auto">
      {notifications.map((n) => (
        <li key={n.id}>
          <button
            type="button"
            onClick={() => onItemClick(n)}
            className="flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className={n.isRead ? "text-gray-500 dark:text-gray-400" : "font-medium text-gray-900 dark:text-gray-100"}>
              {n.message}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatRelativeTime(n.createdAt)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AdminTopBar() {
  const router = useRouter();
  const { count, hasNewNotification, dismissNewNotification, resetCount } =
    useNotificationCount();
  const [panelOpen, setPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    if (!panelOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [panelOpen]);

  const openPanel = useCallback(async () => {
    setPanelOpen(true);
    setLoadingPanel(true);

    try {
      // Fetch notifications list
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = (await res.json()) as { notifications: Notification[] };
        setNotifications(data.notifications);
      }

      // Mark all as read — only reset count on success
      const readRes = await fetch("/api/admin/notifications/read-all", { method: "POST" });
      if (readRes.ok) resetCount();
    } catch {
      // Silently ignore errors
    } finally {
      setLoadingPanel(false);
    }
  }, [resetCount]);

  const handleItemClick = useCallback(
    (n: Notification) => {
      setPanelOpen(false);
      if (n.profileId) {
        router.push(`/admin/hired-pool/${n.profileId}`);
      } else {
        router.push("/admin/hired-rate");
      }
    },
    [router],
  );

  const handleToastClick = useCallback(() => {
    dismissNewNotification();
    router.push("/admin/hired-rate");
  }, [dismissNewNotification, router]);

  const displayCount = count > 99 ? "99+" : String(count);

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {hasNewNotification && (
          <NotificationToast
            onDismiss={dismissNewNotification}
            onClick={handleToastClick}
          />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="flex h-12 items-center justify-end gap-3 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950 lg:px-6">
        {/* Bell icon */}
        <div ref={panelRef} className="relative">
          <button
            type="button"
            onClick={panelOpen ? () => setPanelOpen(false) : openPanel}
            className="relative rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors"
            aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
          >
            <Bell size={18} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {displayCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          <AnimatePresence>
            {panelOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 z-50"
              >
                <div className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Notifications
                  </h3>
                </div>
                {loadingPanel ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    Loading...
                  </div>
                ) : (
                  <NotificationPanel
                    notifications={notifications}
                    onItemClick={handleItemClick}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
