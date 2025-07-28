"use client";

import { useEffect, useState, useRef } from "react";
import type { Job } from "@/generated/prisma";
import Link from "next/link";
import JobCard from "@/components/JobCard";
import SummaryCard from "@/components/SummaryCard";
import FilterSection from "@/components/FilterSection";
// import { motion, AnimatePresence } from "framer-motion";

import {
  Plus,
  ClipboardList,
  ChartNoAxesCombined,
  Trash2,
  Search,
  ThumbsUp,
} from "lucide-react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   ResponsiveContainer,
//   Cell,
// } from "recharts";

type Props = {
  user: {
    name?: string | null;
    email?: string | null;
  };
};

export default function DashboardClient({ user }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // For active jobs (not soft-deleted)
  useEffect(() => {
    const fetchJobs = async () => {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data); // For active jobs only
    };
    fetchJobs();
  }, []);

  // For outcomeData including soft-deleted jobs
  useEffect(() => {
    const fetchAllJobs = async () => {
      const res = await fetch("/api/jobs/all");
      const data = await res.json();
      setAllJobs(data); // For all jobs including soft-deleted
    };
    fetchAllJobs();
  }, []);

  const statusCounts = jobs.reduce((acc, job) => {
    if (job.status !== "offer" && job.status !== "rejected") {
      acc[job.status] = (acc[job.status] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const STATUS_COLORS: Record<string, string> = {
    resume: "#9fa8b7",
    interview: "#5694f7",
    interview2: "#4625cb",
    interview3: "#a213b2",
    offer: "#10b981",
    rejected: "#ef4444",
  };

  const activeJobs = jobs.filter((job) => job.deletedAt === null);

  // Chart for application status overview: This includes only active jobs
  const chartData = ["resume", "interview", "interview2", "interview3"].map(
    (status) => ({
      statusKey: status,
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: statusCounts[status] || 0,
    })
  );

  // Chart for final outcomes:
  // This includes soft-deleted jobs
  const outcomeData = ["offer", "rejected"].map((status) => ({
    statusKey: status,
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count: allJobs.filter((job) => job.status === status).length, // ✅ allJobs 사용
  }));

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredJobs = jobs
    .filter((job) => job.status !== "offer" && job.status !== "rejected")
    .filter((job) => {
      const matchesSearch =
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || job.status === filterStatus;

      return matchesSearch && matchesStatus;
    });

  // Calculate total interviews from all interview stages
  const totalInterviews =
    (statusCounts["interview"] || 0) +
    (statusCounts["interview2"] || 0) +
    (statusCounts["interview3"] || 0);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Welcome, <span className="text-indigo-600">{user.name}</span>
          </h1>
          <p className="text-md sm:text-lg text-gray-500 sm:text-right">
            Here is your current applications
          </p>
        </div>
        <div className="flex gap-2 py-4">
          <Link
            href="/jobs/new"
            className="flex gap-2 items-center bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 text-sm"
          >
            <Plus size={20} className="" /> Add New
          </Link>
          <Link
            href="/dashboard/trash"
            className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 transition-all text-sm"
          >
            <Trash2 size={20} />
            Trash Bin
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="ACTIVE FORMS"
          value={activeJobs.length}
          color="bg-purple-200"
          textColor="text-purple-800"
        />
        <SummaryCard
          title="INTERVIEWS"
          value={totalInterviews}
          color="bg-blue-200"
          textColor="text-blue-800"
        />
        <SummaryCard
          title="OFFERED"
          value={offerCount}
          color="bg-green-200"
          textColor="text-green-800"
        />
        <SummaryCard
          title="REJECTED"
          value={rejectedCount}
          color="bg-red-200"
          textColor="text-red-800"
        />
      </div>

      {/* Filter Section */}
      <FilterSection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      {/* Job Cards */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <JobCard
            key={job.id}
            {...job}
            onDelete={async (id) => {
              const res = await fetch(`/api/jobs/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ softDelete: true }),
              });
              if (res.ok) {
                setJobs((prev) => prev.filter((j) => j.id !== id));
              } else {
                alert("Failed to delete job");
              }
            }}
            onStatusChange={async (id, newStatus) => {
              const res = await fetch(`/api/jobs/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...job, status: newStatus }),
              });

              if (res.ok) {
                // If offer or rejected, remove from active jobs
                // Otherwise, update status in the list
                if (newStatus === "offer" || newStatus === "rejected") {
                  setJobs((prev) => prev.filter((j) => j.id !== id));
                } else {
                  setJobs((prev) =>
                    prev.map((j) =>
                      j.id === id ? { ...j, status: newStatus } : j
                    )
                  );
                }
              } else {
                alert("Failed to update status");
              }
            }}
          />
        ))}
      </ul>
    </section>
  );
}
