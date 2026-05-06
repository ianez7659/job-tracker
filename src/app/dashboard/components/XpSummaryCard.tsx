"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface XpSummary {
  totalXp: number;
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  progress: number;
}

const DEFAULT_SUMMARY: XpSummary = {
  totalXp: 0,
  level: 1,
  currentLevelXp: 0,
  xpToNextLevel: 100,
  progress: 0,
};

interface Props {
  /** Increment to trigger a refetch (e.g. after job creation). */
  refreshToken?: number;
}

export default function XpSummaryCard({ refreshToken = 0 }: Props) {
  const [summary, setSummary] = useState<XpSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/xp/summary", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: XpSummary = await res.json();
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setSummary(DEFAULT_SUMMARY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshToken]);

  const data = summary ?? DEFAULT_SUMMARY;
  const pct = Math.round(data.progress * 100);

  return (
    <section
      className="mb-4 border border-gray-400 dark:border-slate-200 rounded-lg bg-white dark:bg-slate-700 shadow-sm p-4"
      aria-label="XP Summary"
    >
      <h2 className="flex items-center gap-2 font-bold text-xl text-gray-700 dark:text-gray-200 mb-3">
        <Zap size={22} aria-hidden="true" />
        Progress
      </h2>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      ) : (
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Level {data.level}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {data.currentLevelXp} / {data.xpToNextLevel} XP
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="h-2.5 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-600"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Level ${data.level} progress: ${pct}%`}
          >
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
            {data.xpToNextLevel - data.currentLevelXp} XP to next level
          </p>
        </div>
      )}
    </section>
  );
}
