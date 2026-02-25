"use client";

import { useEffect, useState, useMemo } from "react";
import { Job } from "@/generated/prisma";
import { ChartNoAxesCombined, ThumbsUp, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  resume: "#9fa8b7",
  interview1: "#5694f7",
  interview2: "#4625cb",
  interview3: "#a213b2",
  offer: "#10b981",
  rejected: "#ef4444",
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type YearMonthRow = { year: number; m1: number; m2: number; m3: number; m4: number; m5: number; m6: number; m7: number; m8: number; m9: number; m10: number; m11: number; m12: number; total: number };

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

export default function StatsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const safeAllJobs = Array.isArray(allJobs) ? allJobs : [];

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => setJobs(Array.isArray(data) ? data : []));
    fetch("/api/jobs/all")
      .then((res) => res.json())
      .then((data) => setAllJobs(Array.isArray(data) ? data : []));
  }, []);

  const chartData = ["resume", "interview1", "interview2", "interview3"].map(
    (status) => ({
      statusKey: status,
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: safeJobs.filter((job) => job.status === status).length,
    })
  );

  const outcomeData = ["offer", "rejected"].map((status) => ({
    statusKey: status,
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count: safeAllJobs.filter((job) => job.status === status).length,
  }));

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

  const offerCount = safeAllJobs.filter((job) => job.status === "offer").length;
  const rejectedCount = safeAllJobs.filter(
    (job) => job.status === "rejected"
  ).length;

  const totalFinalized = offerCount + rejectedCount;
  const offerRate =
    totalFinalized > 0
      ? ((offerCount / totalFinalized) * 100).toFixed(1)
      : "N/A";

  return (
    <section className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Application Statistics</h1>

      {/* Current Application Status */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-8">
        <h2 className="flex text-lg font-semibold mb-4">
          <ChartNoAxesCombined className="mr-2" size={25} />
          Current Application Status
        </h2>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={STATUS_COLORS[entry.statusKey]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly posts created - one year at a time, year dropdown */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-8 overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="flex text-lg font-semibold">
            <Calendar className="mr-2" size={25} />
            Monthly posts created
          </h2>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Year
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800"
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
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-semibold text-gray-700">Year</th>
              {selectedYearMonthsOnly.map((m) => (
                <th key={m.label} className="text-center py-2 px-1 font-semibold text-gray-700">
                  {m.label}
                </th>
              ))}
              <th className="text-center py-2 px-2 font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {selectedYearMonthsOnly.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-4 text-center text-gray-500">
                  No applications in {selectedYear}.
                </td>
              </tr>
            ) : (
              <tr className="border-b border-gray-100 hover:bg-slate-50">
                <td className="py-2 px-2 font-medium text-gray-800">{selectedYearRow.year}</td>
                {selectedYearMonthsOnly.map((m) => (
                  <td key={m.label} className="text-center py-2 px-1">
                    {m.count}
                  </td>
                ))}
                <td className="text-center py-2 px-2 font-medium text-gray-800">{selectedYearRow.total}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex justify-between mb-4">
          <h2 className="flex text-lg font-semibold mb-4">
            <ChartNoAxesCombined className="mr-2" size={25} />
            Final Outcomes
          </h2>
          <p className="text-gray-600 flex flex-row gap-2">
            <ThumbsUp size={18} />
            Rate: {offerRate === "N/A" ? "Not available yet" : `${offerRate}%`}
          </p>
        </div>

        <div className="w-full h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={outcomeData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="status"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {outcomeData.map((entry, index) => (
                  <Cell key={index} fill={STATUS_COLORS[entry.statusKey]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
