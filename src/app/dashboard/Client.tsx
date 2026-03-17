"use client";

import { useMemo, useState } from "react";
import type { Job } from "@/generated/prisma";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import FilterSection from "@/components/FilterSection";
import { Plus, Trash2, LayoutList, LayoutDashboard } from "lucide-react";

// Dashboard-local pieces
import OverviewSection from "@/app/dashboard/components/OverviewSection";
import ProgressSection from "@/app/dashboard/components/ProgressSection";
import JobList from "@/app/dashboard/components/JobList";
import NewJobModal from "@/app/dashboard/components/NewJobModal";
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
  | "applying"
  | "resume"
  | "interview1"
  | "interview2"
  | "interview3";

export default function DashboardClient({ user }: Props) {
  const router = useRouter();
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
    [activeJobs],
  );
  const interviewCount = useMemo(
    () =>
      (counts["interview1"] ?? 0) +
      (counts["interview2"] ?? 0) +
      (counts["interview3"] ?? 0),
    [counts],
  );

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showNewModal, setShowNewModal] = useState(false);

  // Adapter for components that expect a string setter (e.g., FilterSection)
  const setFilterStatusFromString = (s: string) => {
    // Coerce to FilterStatus; adjust here if you add more filter values
    setFilterStatus(s as FilterStatus);
  };

  const setFilterStatusFromFilter = (s: FilterStatus) => {
    setFilterStatus(s);
  };

  // Filtered list (active, non-finalized)
  const filteredJobs = useMemo(() => {
    return safeJobs
      .filter((job) => job.status !== "offer" && job.status !== "rejected")
      .filter((job) => {
        const q = searchTerm.toLowerCase();
        const company = (job.company ?? "").toLowerCase();
        const title = (job.title ?? "").toLowerCase();
        const matchesSearch =
          company.includes(q) || title.includes(q);
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
        j.id === id ? { ...j, deletedAt: new Date() } : j,
      ),
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
          j.id === id ? { ...j, status: newStatus, deletedAt: new Date() } : j,
        ),
      );
    } else {
      setJobs((p) =>
        (Array.isArray(p) ? p : []).map((j) =>
          j.id === id ? { ...j, status: newStatus } : j,
        ),
      );
      setAllJobs((p) =>
        (Array.isArray(p) ? p : []).map((j) =>
          j.id === id ? { ...j, status: newStatus, deletedAt: null } : j,
        ),
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
    <section className="p-4 sm:px-6 sm:py-2 min-h-screen flex flex-col lg:h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Welcome,{" "}
            <span className="text-indigo-600 dark:text-yellow-400">
              {user.name}
            </span>
          </h1>
          <p className="text-md sm:text-lg text-gray-600 dark:text-gray-300 ">
            Here is your current applications
          </p>
        </div>
        <div className="flex gap-2 py-4">
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="flex gap-2 border border-indigo-800 dark:border-yellow-800 shadow-md items-center bg-indigo-500 dark:bg-yellow-500 text-white px-4 py-2 rounded hover:bg-indigo-600 dark:hover:bg-yellow-600 text-sm"
          >
            <Plus size={20} /> Add New
          </button>
          <Link
            href="/dashboard/trash"
            className="flex items-center gap-2 border border-red-400 dark:border-red-800 shadow-md bg-red-200 dark:bg-red-600 text-red-700 dark:text-red-100 px-4 py-2 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-all text-sm"
          >
            <Trash2 size={20} />
            Trash Bin
          </Link>
        </div>
      </div>

      {/* Single card: left (overview + progress + filter) + right (scrollable job cards) */}
      <motion.div
        className="flex flex-col lg:flex-row flex-1 min-h-0 rounded-lg border border-gray-300 dark:border-slate-300 bg-slate-50 dark:bg-slate-800 shadow-md overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.35, 1] }}
      >
        {/* Left column: same structure as right (title + scrollable content) */}
        <motion.div
          className="lg:w-xl xl:w-2xl flex-shrink-0 flex flex-col min-h-0 border-r border-gray-200 dark:border-slate-600"
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.08, ease: [0.25, 0.1, 0.35, 1] }}
        >
          <h2 className="flex items-center gap-2 font-bold text-2xl text-gray-700 dark:text-gray-200 p-4 pb-0 flex-shrink-0">
            <LayoutDashboard size={24} aria-hidden="true" />
            Overview & Filters
          </h2>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 pt-3">
            <OverviewSection
              todayCount={todayCount}
              totalActive={activeJobs.length}
              // waitingCount={waitingCount}
              // decidedCount={decidedCount}
              setFilterStatus={setFilterStatus}
              embedded
            />
            <ProgressSection
              resumeCount={waitingCount}
              totalActive={activeJobs.length}
              interviewCount={interviewCount}
              decidedCount={decidedCount}
              setFilterStatus={setFilterStatusFromFilter}
              onArchiveClick={() => router.push("/dashboard/archive")}
              embedded
              currentStatus={filterStatus}
            />
            <section className="border-t border-gray-400 dark:border-slate-300 pt-4 mt-4">
              <FilterSection
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatusFromString}
              />
            </section>
          </div>
        </motion.div>

        {/* Right column: same structure as left (title + scrollable content) */}
        <motion.div
          className="flex-1 min-w-0 min-h-0 flex flex-col pb-4"
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.08, ease: [0.25, 0.1, 0.35, 1] }}
        >
          <h2 className="flex items-center gap-2 font-bold text-2xl text-gray-700 dark:text-gray-200 p-4 pb-0 flex-shrink-0">
            <LayoutList size={24} aria-hidden="true" />
            Card List
            <span className="text-xl font-semibold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
              {filteredJobs.length}
            </span>
          </h2>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 pt-3">
            <JobList
              jobs={filteredJobs}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              singleColumn
            />
          </div>
        </motion.div>
      </motion.div>

      {showNewModal && (
        <NewJobModal
          onClose={() => setShowNewModal(false)}
          onCreated={(job: Job) => {
            // 새로 만든 카드를 활성 목록에 바로 반영
            setJobs((prev) => {
              const list = Array.isArray(prev) ? prev : [];
              return [...list, job];
            });
            setAllJobs((prev) => {
              const list = Array.isArray(prev) ? prev : [];
              return [...list, job];
            });
            setShowNewModal(false);
          }}
        />
      )}
    </section>
  );
}
