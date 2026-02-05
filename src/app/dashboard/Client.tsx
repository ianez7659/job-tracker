"use client";

import { useMemo, useState } from "react";
import type { Job } from "@/generated/prisma";
import Link from "next/link";
import FilterSection from "@/components/FilterSection";
import { Plus, Trash2 } from "lucide-react";

// Dashboard-local pieces
import OverviewSection from "@/app/dashboard/components/OverviewSection";
import InterviewProgress from "@/app/dashboard/components/InterviewProgress";
import JobList from "@/app/dashboard/components/JobList";
import { useJobs } from "@/app/dashboard/hooks/useJobs";
import { useAllJobs } from "@/app/dashboard/hooks/useAllJobs";
import {
  activeOnly,
  countDecided,
  countToday,
  countWaitingActive,
  statusCountsActive,
} from "@/app/dashboard/lib/jobs/metrics";

type Props = {
  user: {
    name?: string | null;
    email?: string | null;
  };
};

// Narrowed union for safer filtering (matches your UI statuses)
type FilterStatus =
  | "all"
  | "resume"
  | "interview1"
  | "interview2"
  | "interview3";

export default function DashboardClient({ user }: Props) {
  // Data fetching hooks
  const { jobs, setJobs } = useJobs();
  const { allJobs, setAllJobs } = useAllJobs();

  // Ensure arrays are always arrays (defensive programming)
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const safeAllJobs = Array.isArray(allJobs) ? allJobs : [];

  // Derived sets and counts
  const activeJobs = useMemo(() => activeOnly(safeJobs), [safeJobs]);
  const counts = useMemo(() => statusCountsActive(activeJobs), [activeJobs]);
  const todayCount = useMemo(() => countToday(safeAllJobs), [safeAllJobs]);
  const decidedCount = useMemo(() => countDecided(safeAllJobs), [safeAllJobs]);
  const waitingCount = useMemo(
    () => countWaitingActive(activeJobs),
    [activeJobs]
  );

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // Adapter for components that expect a string setter (e.g., FilterSection)
  const setFilterStatusFromString = (s: string) => {
    // Coerce to FilterStatus; adjust here if you add more filter values
    setFilterStatus(s as FilterStatus);
  };

  // Filtered list (active, non-finalized)
  const filteredJobs = useMemo(() => {
    return safeJobs
      .filter((job) => job.status !== "offer" && job.status !== "rejected")
      .filter((job) => {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          job.company.toLowerCase().includes(q) ||
          job.title.toLowerCase().includes(q);
        const matchesStatus =
          filterStatus === "all" || job.status === filterStatus;
        return matchesSearch && matchesStatus;
      });
  }, [safeJobs, searchTerm, filterStatus]);

  // Actions
  const onDelete = async (id: string) => {
    // Optimistically remove from active list; mirror deletedAt in allJobs
    const prevJobs = safeJobs;
    const prevAll = safeAllJobs;

    setJobs((p) => (Array.isArray(p) ? p : []).filter((j) => j.id !== id));
    setAllJobs((p) =>
      (Array.isArray(p) ? p : []).map((j) =>
        j.id === id ? { ...j, deletedAt: new Date() } : j
      )
    );

    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ softDelete: true }),
    });

    if (!res.ok) {
      // Roll back both states on failure
      setJobs(prevJobs);
      setAllJobs(prevAll);
      alert("Failed to delete job");
    }
  };

  const onStatusChange = async (id: string, newStatus: Job["status"]) => {
    // Optimistic update with Date-safe fields, keep allJobs in sync
    const isFinal = newStatus === "offer" || newStatus === "rejected";
    const prevJobs = safeJobs;
    const prevAll = safeAllJobs;

    if (isFinal) {
      setJobs((p) => (Array.isArray(p) ? p : []).filter((j) => j.id !== id));
      setAllJobs((p) =>
        (Array.isArray(p) ? p : []).map((j) =>
          j.id === id ? { ...j, status: newStatus, deletedAt: new Date() } : j
        )
      );
    } else {
      setJobs((p) =>
        (Array.isArray(p) ? p : []).map((j) =>
          j.id === id ? { ...j, status: newStatus } : j
        )
      );
      setAllJobs((p) =>
        (Array.isArray(p) ? p : []).map((j) =>
          j.id === id ? { ...j, status: newStatus, deletedAt: null } : j
        )
      );
    }

    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      // Roll back both states on failure
      setJobs(prevJobs);
      setAllJobs(prevAll);
      alert("Failed to update status");
    }
  };

  return (
    <section className="p-4 sm:p-6 bg-slate-200 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Welcome, <span className="text-indigo-600">{user.name}</span>
          </h1>
          <p className="text-md sm:text-lg text-gray-600 ">
            Here is your current applications
          </p>
        </div>
        <div className="flex gap-2 py-4">
          <Link
            href="/dashboard/jobs/new"
            className="flex gap-2 shadow-md items-center bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 text-sm"
          >
            <Plus size={20} /> Add New
          </Link>
          <Link
            href="/dashboard/trash"
            className="flex items-center gap-2 shadow-md bg-red-200 text-red-700 px-4 py-2 rounded hover:bg-red-200 transition-all text-sm"
          >
            <Trash2 size={20} />
            Trash Bin
          </Link>
        </div>
      </div>

      {/* Summary Section shell */}
      <div className="rounded-lg border border-gray-300 p-4 grid gap-4 mb-6 bg-slate-50 shadow-md">
        <OverviewSection
          todayCount={todayCount}
          totalActive={activeJobs.length}
          waitingCount={waitingCount}
          decidedCount={decidedCount}
          setFilterStatus={setFilterStatus} // Overview & InterviewProgress accept FilterStatus
        />

        <InterviewProgress counts={counts} setFilterStatus={setFilterStatus} />

        <section className="border-t border-gray-400 py-4">
          <FilterSection
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            // Use adapter if FilterSection expects (s: string) => void
            setFilterStatus={setFilterStatusFromString}
          />
        </section>

        <JobList
          jobs={filteredJobs}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      </div>
    </section>
  );
}
