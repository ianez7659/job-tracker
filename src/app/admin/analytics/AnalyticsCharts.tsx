"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import type { AdminAnalytics } from "@/domains/admin/types";

const STATUS_COLORS: Record<string, string> = {
  applying:   "#6366f1",
  resume:     "#8b5cf6",
  interview1: "#f59e0b",
  interview2: "#f97316",
  interview3: "#fb923c",
  offer:      "#10b981",
  rejected:   "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  applying: "Applying",
  resume: "Waiting",
  interview1: "Interview 1",
  interview2: "Interview 2",
  interview3: "Interview 3",
  offer: "Offered",
  rejected: "Rejected",
};

const SEGMENT_COLORS = ["#6366f1", "#10b981", "#6b7280"];

// Tooltip style presets
const TOOLTIP_DARK = {
  content: { background: "#111827", border: "1px solid #374151", borderRadius: 8 },
  label: { color: "#f3f4f6" },
  item: { color: "#d1d5db" },
};
const TOOLTIP_LIGHT = {
  content: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 },
  label: { color: "#111827" },
  item: { color: "#374151" },
};

interface Props {
  analytics: AdminAnalytics;
}

export default function AnalyticsCharts({ analytics }: Props) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const tt = isDark ? TOOLTIP_DARK : TOOLTIP_LIGHT;
  const tickColor = isDark ? "#9ca3af" : "#6b7280";

  const hiredPct = (analytics.hiredRate * 100).toFixed(1);
  const interviewPct = (analytics.interviewRate * 100).toFixed(1);

  const segmentData = [
    { name: "Active", value: analytics.userSegments.active },
    { name: "Hired", value: analytics.userSegments.hired },
    { name: "Inactive", value: analytics.userSegments.inactive },
  ];

  const statusData = analytics.applicationsByStatus.map((s) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    count: s.count,
    color: STATUS_COLORS[s.status] ?? "#6b7280",
  }));

  return (
    <div className="space-y-8">
      {/* Row 1 — KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Users" value={analytics.totalStudents} />
        <KpiCard
          label="Hired Rate"
          value={`${hiredPct}%`}
          sub={`${analytics.hiredCount} / ${analytics.totalStudents} users`}
          accent="green"
        />
        <KpiCard
          label="Interview Rate"
          value={`${interviewPct}%`}
          sub="of active seekers reached interview"
          accent="yellow"
        />
        <KpiCard
          label="Active Seekers"
          value={analytics.userSegments.active}
          sub="logged in last 3 days"
        />
      </div>

      {/* Row 2 — Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Users by Target Track */}
        <ChartCard title="Users by Target Track">
          <ResponsiveContainer width="100%" height={Math.max(220, analytics.usersByTrack.length * 40)}>
            <BarChart
              data={analytics.usersByTrack}
              layout="vertical"
              margin={{ left: 8, right: 24 }}
            >
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: tickColor, fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={140}
                interval={0}
                tick={{ fill: tickColor, fontSize: 11 }}
              />
              <Tooltip
                contentStyle={tt.content}
                labelStyle={tt.label}
                itemStyle={tt.item}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Applications by Status */}
        <ChartCard title="Applications by Status">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} margin={{ left: 8, right: 24 }}>
              <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 10 }} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} />
              <Tooltip
                contentStyle={tt.content}
                labelStyle={tt.label}
                itemStyle={tt.item}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* User Segments Pie */}
        <ChartCard title="User Segments — Active / Hired / Inactive">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={segmentData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {segmentData.map((_, i) => (
                  <Cell key={i} fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => (
                  <span style={{ color: tickColor, fontSize: 12 }}>{value}</span>
                )}
              />
              <Tooltip
                contentStyle={tt.content}
                itemStyle={tt.item}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ── Internal sub-components ──────────────────────────────────────────────────

type Accent = "default" | "green" | "yellow";

const ACCENT_CLASS: Record<Accent, string> = {
  default: "text-gray-900 dark:text-gray-100",
  green: "text-emerald-600 dark:text-emerald-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
};

function KpiCard({
  label,
  value,
  sub,
  accent = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: Accent;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-2 font-mono text-3xl font-bold tabular-nums ${ACCENT_CLASS[accent]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      {children}
    </div>
  );
}
