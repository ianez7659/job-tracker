"use client";

import { useEffect, useState, useMemo } from "react";
import type { Job } from "@/generated/prisma";
import { ChartNoAxesCombined, Calendar } from "lucide-react";
import {
  buildCurrentStatusEntries,
  buildCycleEndEntries,
  countClosedCycles,
  type StatsBarEntry,
} from "@/app/dashboard/lib/stats/statsTransforms";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type YearMonthRow = { year: number; m1: number; m2: number; m3: number; m4: number; m5: number; m6: number; m7: number; m8: number; m9: number; m10: number; m11: number; m12: number; total: number };

function SimpleBars({ entries }: { entries: StatsBarEntry[] }) {
  const max = Math.max(1, ...entries.map((e) => e.count));

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const pct = Math.round((entry.count / max) * 100);
        return (
          <div
            key={entry.key}
            className="grid grid-cols-[120px_1fr_38px] gap-2 items-center"
          >
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">
              {entry.label}
            </span>
            <div className="h-2.5 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: entry.color,
                }}
              />
            </div>
            <span className="text-xs sm:text-sm text-right text-gray-800 dark:text-gray-100">
              {entry.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function buildYearMonthTable(jobs: Job[]): YearMonthRow[] {
  const countByYearMonth = new Map<string, number>();
  for (const job of jobs) {
    const d = job.createdAt ? new Date(job.createdAt as unknown as string) : new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${month}`;
    countByYearMonth.set(key, (countByYearMonth.get(key) ?? 0) + 1);
  }
  const yearsSet = new Set<number>();
  countByYearMonth.forEach((_, key) => yearsSet.add(Number(key.split("-")[0])));
  const years = Array.from(yearsSet).sort((a, b) => b - a);

  return years.map((year) => {
    const m1 = countByYearMonth.get(`${year}-1`) ?? 0;
    const m2 = countByYearMonth.get(`${year}-2`) ?? 0;
    const m3 = countByYearMonth.get(`${year}-3`) ?? 0;
    const m4 = countByYearMonth.get(`${year}-4`) ?? 0;
    const m5 = countByYearMonth.get(`${year}-5`) ?? 0;
    const m6 = countByYearMonth.get(`${year}-6`) ?? 0;
    const m7 = countByYearMonth.get(`${year}-7`) ?? 0;
    const m8 = countByYearMonth.get(`${year}-8`) ?? 0;
    const m9 = countByYearMonth.get(`${year}-9`) ?? 0;
    const m10 = countByYearMonth.get(`${year}-10`) ?? 0;
    const m11 = countByYearMonth.get(`${year}-11`) ?? 0;
    const m12 = countByYearMonth.get(`${year}-12`) ?? 0;
    return {
      year,
      m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12,
      total: m1 + m2 + m3 + m4 + m5 + m6 + m7 + m8 + m9 + m10 + m11 + m12,
    };
  });
}

type StatsTab = "current" | "cycle-end";

export default function StatsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatsTab>("current");

  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const safeAllJobs = Array.isArray(allJobs) ? allJobs : [];

  useEffect(() => {
    let cancelled = false;
    const fetchJsonWithTimeout = async (url: string, timeoutMs = 12000) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } finally {
        clearTimeout(timeout);
      }
    };

    void (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [jobsData, allJobsData] = await Promise.all([
          fetchJsonWithTimeout("/api/jobs"),
          fetchJsonWithTimeout("/api/jobs/all"),
        ]);
        if (!cancelled) {
          setJobs(Array.isArray(jobsData) ? jobsData : []);
          setAllJobs(Array.isArray(allJobsData) ? allJobsData : []);
        }
      } catch (e) {
        if (!cancelled) {
          setJobs([]);
          setAllJobs([]);
          setLoadError(
            e instanceof Error
              ? `Failed to load stats: ${e.message}`
              : "Failed to load stats.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentEntries = useMemo(
    () => buildCurrentStatusEntries(safeJobs),
    [safeJobs],
  );

  const cycleEndEntries = useMemo(
    () => buildCycleEndEntries(safeAllJobs),
    [safeAllJobs],
  );

  const closedCycleCount = useMemo(
    () => countClosedCycles(safeAllJobs),
    [safeAllJobs],
  );

  const monthlyData = useMemo(
    () => buildYearMonthTable(safeAllJobs),
    [safeAllJobs]
  );

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const fromData = monthlyData.map((r) => r.year);
    const years = Array.from(new Set([...fromData, currentYear])).sort((a, b) => b - a);
    return years;
  }, [monthlyData]);

  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  const selectedYearRow = useMemo((): YearMonthRow => {
    const found = monthlyData.find((r) => r.year === selectedYear);
    if (found) return found;
    return {
      year: selectedYear,
      m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, m6: 0,
      m7: 0, m8: 0, m9: 0, m10: 0, m11: 0, m12: 0,
      total: 0,
    };
  }, [monthlyData, selectedYear]);

  const selectedYearMonthsOnly = useMemo(() => {
    const row = selectedYearRow;
    const counts = [row.m1, row.m2, row.m3, row.m4, row.m5, row.m6, row.m7, row.m8, row.m9, row.m10, row.m11, row.m12];
    return MONTH_LABELS.map((label, i) => ({ label, count: counts[i] })).filter((m) => m.count > 0);
  }, [selectedYearRow]);

  const TAB_ITEMS: { id: StatsTab; label: string }[] = [
    { id: "current", label: "Current" },
    { id: "cycle-end", label: "Cycle End" },
  ];

  return (
    <section className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Application Statistics</h1>
      {loading && (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Loading stats…</p>
      )}
      {loadError && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>
      )}

      {/* Status Distribution — tabbed */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md dark:shadow-slate-900/50 p-4 mb-8 border border-transparent dark:border-slate-600">
        <h2 className="flex items-center text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          <ChartNoAxesCombined className="mr-2" size={25} />
          Application Status
        </h2>

        {/* Tab bar */}
        <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-slate-600">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-t transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-800 border border-b-white dark:border-slate-600 dark:border-b-slate-800 -mb-px text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Current tab */}
        {activeTab === "current" && (
          <div className="w-full">
            <SimpleBars entries={currentEntries} />
          </div>
        )}

        {/* Cycle End tab */}
        {activeTab === "cycle-end" && (
          <div className="w-full">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              How far did each closed application progress?
            </p>
            {cycleEndEntries.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No closed cycles yet.
              </p>
            ) : (
              <SimpleBars entries={cycleEndEntries} />
            )}
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Total closed cycles: <span className="font-medium text-gray-700 dark:text-gray-300">{closedCycleCount}</span>
            </p>
          </div>
        )}
      </div>

      {/* Monthly posts created - one year at a time, year dropdown */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md dark:shadow-slate-900/50 p-4 mb-8 overflow-x-auto border border-transparent dark:border-slate-600">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="flex text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Calendar className="mr-2" size={25} />
            Monthly posts created
          </h2>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            Year
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-gray-300 dark:border-slate-600 rounded px-3 py-1.5 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-600">
              <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-200">Year</th>
              {selectedYearMonthsOnly.map((m) => (
                <th key={m.label} className="text-center py-2 px-1 font-semibold text-gray-700 dark:text-gray-200">
                  {m.label}
                </th>
              ))}
              <th className="text-center py-2 px-2 font-semibold text-gray-700 dark:text-gray-200">Total</th>
            </tr>
          </thead>
          <tbody>
            {selectedYearMonthsOnly.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No applications in {selectedYear}.
                </td>
              </tr>
            ) : (
              <tr className="border-b border-gray-100 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                <td className="py-2 px-2 font-medium text-gray-800 dark:text-gray-100">{selectedYearRow.year}</td>
                {selectedYearMonthsOnly.map((m) => (
                  <td key={m.label} className="text-center py-2 px-1 text-gray-900 dark:text-gray-100">
                    {m.count}
                  </td>
                ))}
                <td className="text-center py-2 px-2 font-medium text-gray-800 dark:text-gray-100">{selectedYearRow.total}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
