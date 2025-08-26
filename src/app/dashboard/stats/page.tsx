"use client";

import { useEffect, useState } from "react";
import { Job } from "@/generated/prisma";
import { ChartNoAxesCombined, ThumbsUp } from "lucide-react";
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

export default function StatsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then(setJobs);
    fetch("/api/jobs/all")
      .then((res) => res.json())
      .then(setAllJobs);
  }, []);

  const chartData = ["resume", "interview1", "interview2", "interview3"].map(
    (status) => ({
      statusKey: status,
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: jobs.filter((job) => job.status === status).length,
    })
  );

  const outcomeData = ["offer", "rejected"].map((status) => ({
    statusKey: status,
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count: allJobs.filter((job) => job.status === status).length,
  }));

  const offerCount = allJobs.filter((job) => job.status === "offer").length;
  const rejectedCount = allJobs.filter(
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

      {/* 상태 그래프 */}
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
