"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Loader2,
  PartyPopper,
  Send,
  Sparkles,
  Star,
  Sun,
  Target,
} from "lucide-react";
import {
  fallbackIncompleteMissionsPayload,
  type MissionId,
  type MissionRowDTO,
  type MissionsPayload,
} from "@/lib/xp/missionsDisplayCore";

const EMPTY_PAYLOAD: MissionsPayload = {
  daily: [],
  weekly: [],
  dailyRemaining: 0,
  weeklyRemaining: 0,
};

/** Absolute same-origin URL so requests never resolve against a wrong path (e.g. PWA / relative quirks). */
function apiUrl(path: string): string {
  if (typeof window === "undefined") return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${p}`;
}

function missionIcon(id: MissionId) {
  switch (id) {
    case "daily_check_in":
      return <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-300" aria-hidden />;
    case "daily_job_card":
      return <Send className="h-5 w-5 text-indigo-600 dark:text-indigo-300" aria-hidden />;
    case "daily_interview_drill":
      return <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-300" aria-hidden />;
    case "weekly_review":
      return <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-300" aria-hidden />;
    case "weekly_cycle":
      return <CalendarDays className="h-5 w-5 text-indigo-600 dark:text-indigo-300" aria-hidden />;
    default:
      return <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-300" aria-hidden />;
  }
}

function MissionRow({
  row,
  onStart,
  busyId,
}: {
  row: MissionRowDTO;
  onStart: (id: MissionId) => void;
  busyId: MissionId | null;
}) {
  const busy = busyId === row.id;
  return (
    <div className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-800/80 sm:p-4">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50"
        aria-hidden
      >
        {missionIcon(row.id)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{row.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:text-sm">
          {row.description}
        </p>
        {(row.progressLabel || row.rewardLabel) && (
          <div className="mt-1.5 flex items-center gap-2.5 text-xs">
            {row.progressLabel && (
              <span className="font-medium text-gray-500 dark:text-gray-400">
                {row.progressLabel}
              </span>
            )}
            {row.rewardLabel && (
              <span
                className={
                  row.completed
                    ? "font-semibold text-emerald-600 dark:text-emerald-400"
                    : "font-semibold text-indigo-500 dark:text-indigo-300"
                }
              >
                {row.rewardLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center">
        {row.completed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
            <CircleCheck className="h-3.5 w-3.5" aria-hidden />
            Done
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onStart(row.id)}
            disabled={busy}
            className="inline-flex min-h-[2.5rem] min-w-[4.5rem] items-center justify-center rounded-lg border-2 border-indigo-500 px-3 py-2 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-400 dark:text-indigo-300 dark:hover:bg-indigo-950/40 sm:text-sm"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : (row.ctaLabel ?? "Start")}
          </button>
        )}
      </div>
    </div>
  );
}

type Props = {
  refreshToken?: number;
  onStartNewJob: () => void;
  onXpActivity?: () => void;
};

type MissionTab = "daily" | "weekly";

export default function MissionsSection({
  refreshToken = 0,
  onStartNewJob,
  onXpActivity,
}: Props) {
  const router = useRouter();
  const [data, setData] = useState<MissionsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<MissionId | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<MissionTab>("daily");

  const load = useCallback(async () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const res = await fetch(
        `/api/xp/missions?timeZone=${encodeURIComponent(timeZone)}`,
        { cache: "no-store", credentials: "same-origin" },
      );
      if (!res.ok) {
        setData(fallbackIncompleteMissionsPayload(timeZone));
        return;
      }
      const raw: unknown = await res.json();
      if (
        !raw ||
        typeof raw !== "object" ||
        !Array.isArray((raw as MissionsPayload).daily) ||
        !Array.isArray((raw as MissionsPayload).weekly)
      ) {
        setData(fallbackIncompleteMissionsPayload(timeZone));
        return;
      }
      setData(raw as MissionsPayload);
    } catch {
      setData(fallbackIncompleteMissionsPayload(timeZone));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, refreshToken]);

  const handleStart = async (id: MissionId) => {
    if (id === "daily_check_in") {
      setBusyId(id);
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await fetch(apiUrl("/api/xp/daily-check"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeZone }),
        });
        if (res.ok) {
          onXpActivity?.();
          await load();
        }
      } finally {
        setBusyId(null);
      }
      return;
    }
    if (id === "daily_job_card") {
      onStartNewJob();
      return;
    }
    if (id === "daily_interview_drill") {
      router.push("/dashboard/interview-drill");
      return;
    }
    if (id === "weekly_review") {
      router.push("/dashboard/stats");
      return;
    }
    if (id === "weekly_cycle") {
      router.push("/dashboard");
      return;
    }
  };

  const payload = data ?? EMPTY_PAYLOAD;
  const visibleDaily = useMemo(
    () => (showCompleted ? payload.daily : payload.daily.filter((m) => !m.completed)),
    [payload.daily, showCompleted],
  );
  const visibleWeekly = useMemo(
    () => (showCompleted ? payload.weekly : payload.weekly.filter((m) => !m.completed)),
    [payload.weekly, showCompleted],
  );

  return (
    <section
      className="mb-3 flex-shrink-0 rounded-2xl border border-gray-200 bg-gray-50/90 p-4 shadow-sm dark:border-slate-600 dark:bg-slate-900/60 sm:p-5"
      aria-label="Missions"
    >
      {loading ? (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">Loading missions…</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100 sm:text-lg">
              <span className="flex h-9 w-9 items-center justify-center  text-rose-700 dark:text-rose-300">
                <Target className="h-5 w-5" aria-hidden />
              </span>
              Missions
            </h2>
            <button
              type="button"
              onClick={() => setShowCompleted((v) => !v)}
              className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-yellow-700 transition-colors hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-200 dark:hover:bg-yellow-950/40"
            >
              {showCompleted ? "Hide completed" : "Show completed"}
            </button>
          </div>

          <div
            className="mb-4 rounded-2xl border border-gray-200 bg-slate-100/95 p-1 dark:border-slate-600 dark:bg-slate-800/90"
            role="tablist"
            aria-label="Mission schedule"
          >
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button
                type="button"
                role="tab"
                id="missions-tab-daily"
                aria-selected={activeTab === "daily"}
                aria-controls="missions-panel-daily"
                tabIndex={activeTab === "daily" ? 0 : -1}
                onClick={() => setActiveTab("daily")}
                className={`flex min-h-[2.85rem] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 sm:flex-row sm:gap-2.5 sm:px-3 ${
                  activeTab === "daily"
                    ? "bg-emerald-500 text-white shadow-md ring-2 ring-emerald-200/90 dark:bg-emerald-600 dark:ring-emerald-400/40"
                    : "border-2 border-emerald-300/90 bg-white text-emerald-950 shadow-sm hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-500/50 dark:bg-slate-800/80 dark:text-emerald-100 dark:hover:border-emerald-400 dark:hover:bg-emerald-950/35"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sun
                    className={`h-4 w-4 ${
                      activeTab === "daily"
                        ? "text-white"
                        : "text-emerald-700 dark:text-emerald-300"
                    }`}
                    aria-hidden
                  />
                  Daily
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide tabular-nums ring-1 sm:text-xs ${
                    activeTab === "daily"
                      ? "bg-white/25 text-white ring-white/35"
                      : "bg-emerald-100 text-emerald-900 ring-emerald-300/80 dark:bg-emerald-950/70 dark:text-emerald-200 dark:ring-emerald-500/35"
                  }`}
                >
                  {payload.dailyRemaining} left
                </span>
              </button>
              <button
                type="button"
                role="tab"
                id="missions-tab-weekly"
                aria-selected={activeTab === "weekly"}
                aria-controls="missions-panel-weekly"
                tabIndex={activeTab === "weekly" ? 0 : -1}
                onClick={() => setActiveTab("weekly")}
                className={`flex min-h-[2.85rem] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 sm:flex-row sm:gap-2.5 sm:px-3 ${
                  activeTab === "weekly"
                    ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-200/90 dark:bg-blue-600 dark:ring-blue-400/40"
                    : "border-2 border-blue-400/90 bg-white text-blue-950 shadow-sm hover:border-blue-500 hover:bg-blue-50 dark:border-blue-500/50 dark:bg-slate-800/80 dark:text-blue-100 dark:hover:border-blue-400 dark:hover:bg-blue-950/40"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <CalendarDays
                    className={`h-4 w-4 ${
                      activeTab === "weekly"
                        ? "text-white"
                        : "text-blue-700 dark:text-blue-300"
                    }`}
                    aria-hidden
                  />
                  <span className="tracking-tight">Weekly</span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide tabular-nums ring-1 sm:text-xs ${
                    activeTab === "weekly"
                      ? "bg-white/25 text-white ring-white/35"
                      : "bg-blue-100 text-blue-900 ring-blue-300/80 dark:bg-blue-950/70 dark:text-blue-200 dark:ring-blue-500/35"
                  }`}
                >
                  {payload.weeklyRemaining} left
                </span>
              </button>
            </div>
          </div>

          <div
            role="tabpanel"
            id="missions-panel-daily"
            aria-labelledby="missions-tab-daily"
            hidden={activeTab !== "daily"}
            className="flex flex-col gap-2.5"
          >
            {visibleDaily.map((row) => (
              <MissionRow key={row.id} row={row} onStart={handleStart} busyId={busyId} />
            ))}
            {visibleDaily.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white/70 p-3 text-center text-xs leading-normal text-gray-500 dark:border-slate-600 dark:bg-slate-800/60 dark:text-gray-400">
                <PartyPopper
                  className="mr-1 inline-block h-[1.1em] w-[1.1em] align-[-0.15em] text-amber-500 dark:text-amber-400"
                  aria-hidden
                />
                <span className="font-semibold text-gray-700 dark:text-gray-200 text-base">Congratulations!</span><br/>
                All daily missions are done. See you tomorrow!
              </p>
            )}
          </div>

          <div
            role="tabpanel"
            id="missions-panel-weekly"
            aria-labelledby="missions-tab-weekly"
            hidden={activeTab !== "weekly"}
            className="flex flex-col gap-2.5"
          >
            {visibleWeekly.map((row) => (
              <MissionRow key={row.id} row={row} onStart={handleStart} busyId={busyId} />
            ))}
            {visibleWeekly.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white/70 p-3 text-center text-xs text-gray-500 dark:border-slate-600 dark:bg-slate-800/60 dark:text-gray-400">
                All weekly missions are done.
              </p>
            )}
          </div>

          {!(payload.daily.length > 0 && payload.daily.every((m) => m.completed)) && (
            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              <Star className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
              Complete your missions to earn XP!
            </p>
          )}
        </>
      )}
    </section>
  );
}
