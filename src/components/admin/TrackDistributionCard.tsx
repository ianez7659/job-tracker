"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { CategoryCount } from "@/domains/admin/types";

const COLORS = [
  "#6366f1", // indigo  — Web Development
  "#8b5cf6", // violet  — UI/UX Design
  "#f97316", // orange  — Digital Marketing
  "#f59e0b", // amber   — Data Science
  "#10b981", // emerald — others bucket
  "#ef4444", // red
  "#6b7280", // gray
];

const MAX_INDIVIDUAL = 4;

interface Props {
  data: CategoryCount[];
}

export default function TrackDistributionCard({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const top = data.slice(0, MAX_INDIVIDUAL);
  const restCount = data.slice(MAX_INDIVIDUAL).reduce((s, d) => s + d.count, 0);

  const chartData: { label: string; count: number }[] = [
    ...top,
    ...(restCount > 0 ? [{ label: "Others", count: restCount }] : []),
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-sm font-medium uppercase tracking-wider text-gray-600 dark:text-gray-200">
        Users by Target Track
      </p>

      {total === 0 ? (
        <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">No data yet</p>
      ) : (
        <div className="mt-3 flex items-center gap-4">
          {/* Donut chart */}
          <div className="h-24 w-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  innerRadius="58%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={2}
                  stroke="transparent"
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* List */}
          <div className="min-w-0 flex-1 space-y-2">
            {chartData.map((item, i) => {
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-800 dark:text-gray-200">
                    {item.label}
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {item.count} students
                  </span>
                  <span className="w-8 shrink-0 text-right text-xs font-semibold text-gray-400 dark:text-gray-500">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
