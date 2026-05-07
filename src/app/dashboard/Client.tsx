"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutList, LayoutDashboard, Search, Plus } from "lucide-react";

// Dashboard-local pieces
import OverviewSection from "@/app/dashboard/components/OverviewSection";
import ProgressSection from "@/app/dashboard/components/ProgressSection";
import JobList from "@/app/dashboard/components/JobList";
import NewJobModal from "@/app/dashboard/components/NewJobModal";
import NewJobModePicker from "@/app/dashboard/components/NewJobModePicker";
import SimpleNewJobModal from "@/app/dashboard/components/SimpleNewJobModal";
import JobSearchModal from "@/app/dashboard/components/JobSearchModal";
import FindJobsCtaCard from "@/app/dashboard/components/FindJobsCtaCard";
import MissionsSection from "@/app/dashboard/components/MissionsSection";
import XpSummaryCard from "@/app/dashboard/components/XpSummaryCard";
import XpToast from "@/components/XpToast";
import { useJobs } from "@/app/dashboard/hooks/useJobs";
import { useAllJobs } from "@/app/dashboard/hooks/useAllJobs";
import { useSharedEntry } from "@/app/dashboard/hooks/useSharedEntry";
import { useSharedDataStore } from "@/stores/useSharedDataStore";
import {
  activeOnly,
  countWaitingActive,
  isFinal,
  statusCountsActive,
} from "@/app/dashboard/lib/jobs/metrics";
import type { Job } from "@/generated/prisma";

/** Put newly created job at top (matches GET /api/jobs order) and keep deletedAt explicit. */
function upsertJobList(prev: Job[] | undefined, job: Job): Job[] {
  const normalized = {
    ...job,
    deletedAt: job.deletedAt ?? null,
  } as Job;
  const list = Array.isArray(prev) ? prev : [];
  const rest = list.filter((j) => j.id !== normalized.id);
  return [normalized, ...rest].sort(
    (a, b) =>
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
  );
}

type Props = {
  user: {
    name?: string | null;
    email?: string | null;
  };
  /** Set by server from ?newJob=1 — avoids useSearchParams (CSR bailout / fragile hydration). */
  openNewJobFromQuery?: boolean;
  /** ?newJob=auto — same as header “Add New” (clipboard / shared pipeline). */
  openNewJobAutoFromQuery?: boolean;
  /** ?jobSearch=1 — open job search modal. */
  openJobSearchFromQuery?: boolean;
};

// Narrowed union for safer filtering (matches your UI statuses)
type FilterStatus =
  | "all"
  | "applying"
  | "postApplying"
  | "resume"
  | "interview1"
  | "interview2"
  | "interview3";

/** Add-job UI: mode picker → standard modal or simple (card) placeholder. */
type NewJobUi = null | "picker" | "standard" | "simple";

export default function DashboardClient({
  user,
  openNewJobFromQuery = false,
  openNewJobAutoFromQuery = false,
  openJobSearchFromQuery = false,
}: Props) {
  const router = useRouter();

  // Hybrid share/clipboard pipeline
  useSharedEntry();
  const { isSharedEntry, setSharedData, clearSharedData } = useSharedDataStore();

  // Data fetching hooks
  const { jobs, setJobs } = useJobs();
  const { allJobs, setAllJobs } = useAllJobs();

  // Ensure arrays are always arrays (defensive programming)
  const safeJobs = useMemo(() => (Array.isArray(jobs) ? jobs : []), [jobs]);
  const safeAllJobs = useMemo(() => (Array.isArray(allJobs) ? allJobs : []), [allJobs]);

  // Derived sets and counts
  const activeJobs = useMemo(() => activeOnly(safeJobs), [safeJobs]);
  const counts = useMemo(() => statusCountsActive(activeJobs), [activeJobs]);
  const pipelineTotal = useMemo(
    () => activeJobs.filter((j) => !isFinal(j)).length,
    [activeJobs],
  );
  const applyingCount = counts["applying"] ?? 0;
  const appliedCount = useMemo(
    () => Math.max(0, pipelineTotal - applyingCount),
    [pipelineTotal, applyingCount],
  );
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
  const [newJobUi, setNewJobUi] = useState<NewJobUi>(null);
  const [showJobSearch, setShowJobSearch] = useState(false);

  // XP toast + XpSummaryCard refresh
  const [xpToast, setXpToast] = useState(0);
  const [xpRefreshToken, setXpRefreshToken] = useState(0);

  const handleXpGained = (amount: number) => {
    setXpToast(amount);
    setXpRefreshToken((t) => t + 1);
  };

  // Daily XP: once per local day anchored at 05:00 (timezone from browser); server decides eligibility.
  // Re-run when the tab becomes visible so long-lived sessions still pick up the next local period.
  useEffect(() => {
    const runDailyCheck = () => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      fetch("/api/xp/daily-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeZone }),
      })
        .then(async (r) => {
          if (!r.ok) return;
          let data: { xpGained?: number } = {};
          try {
            data = (await r.json()) as { xpGained?: number };
          } catch {
            /* non-JSON */
          }
          const gained = typeof data.xpGained === "number" ? data.xpGained : 0;
          if (gained > 0) {
            setXpToast(gained);
          }
          setXpRefreshToken((t) => t + 1);
        })
        .catch(() => {/* fire-and-forget */});
    };
    runDailyCheck();
    const onVis = () => {
      if (document.visibilityState === "visible") runDailyCheck();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Open mode picker when sidebar uses ?newJob=1 (search read on server, not useSearchParams)
  useEffect(() => {
    if (!openNewJobFromQuery) return;
    setNewJobUi("picker");
    router.replace("/dashboard", { scroll: false });
  }, [openNewJobFromQuery, router]);

  // Auto-open standard modal when shared data arrives via pipeline
  useEffect(() => {
    if (!isSharedEntry) return;
    setNewJobUi("standard");
  }, [isSharedEntry]);

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
          filterStatus === "all" ||
          (filterStatus === "postApplying" && job.status !== "applying") ||
          job.status === filterStatus;
        return matchesSearch && matchesStatus;
      });
  }, [safeJobs, searchTerm, filterStatus]);

  // Add New button handler — attempts clipboard read on user gesture (works on iOS)
  const handleAddNew = async () => {
    // Auto-detect already ran and populated the store → open modal directly
    if (isSharedEntry) {
      setNewJobUi("standard");
      return;
    }

    let url = "";
    let jd = "";

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        const text = (await navigator.clipboard.readText())?.trim() ?? "";
        if (text) {
          if (text.startsWith("http")) {
            url = text;
          } else {
            const isJd = [
                "responsibilities", "requirements", "qualifications",
                "experience", "salary", "benefits", "apply", "position",
                "job description", "we are looking", "you will",
                "must have", "nice to have", "full-time", "part-time", "remote",
              ].some((kw) => text.toLowerCase().includes(kw));
            if (isJd) jd = text;
          }
        }
      }
    } catch {
      // NotAllowedError or unavailable — fall through to Mode Picker
    }

    if (url || jd) {
      setSharedData(url, jd);
      setNewJobUi("standard");
    } else {
      setNewJobUi("picker");
    }
  };

  const handleAddNewRef = useRef(handleAddNew);
  handleAddNewRef.current = handleAddNew;

  // ?newJob=auto — smart add (clipboard / shared), same as former header button
  useEffect(() => {
    if (!openNewJobAutoFromQuery) return;
    void handleAddNewRef.current();
    router.replace("/dashboard", { scroll: false });
  }, [openNewJobAutoFromQuery, router]);

  // ?jobSearch=1 — open Find Jobs modal
  useEffect(() => {
    if (!openJobSearchFromQuery) return;
    setShowJobSearch(true);
    router.replace("/dashboard", { scroll: false });
  }, [openJobSearchFromQuery, router]);

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

  return (
    <section className="flex min-h-screen flex-col p-4 sm:px-6 sm:py-2">
      {/* Header + compact XP (actions moved to sidebar / mobile menu) */}
      <div className="mb-3 flex flex-shrink-0 flex-col gap-3 rounded-lg bg-indigo-600 p-4 dark:bg-indigo-800 sm:p-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-50 dark:text-gray-100 mb-2">
            Welcome,{" "}
            <span className="text-yellow-400 dark:text-yellow-500">
              {user.name}
            </span>
          </h1>
          <p className="text-md sm:text-lg text-gray-50 dark:text-gray-300 ">
            Here is your current applications
          </p>
        </div>
        <div className="w-full md:w-[24rem] md:flex-shrink-0">
          <XpSummaryCard refreshToken={xpRefreshToken} variant="inline" />
        </div>
      </div>

      <MissionsSection
        refreshToken={xpRefreshToken}
        onStartNewJob={() => void handleAddNew()}
        onXpActivity={() => setXpRefreshToken((t) => t + 1)}
      />

      {/* Main card: left (overview + Find Jobs CTA) | right (card list) */}
      <motion.div
        className="flex flex-col flex-1 min-h-0 rounded-lg border border-gray-300 dark:border-slate-300 bg-slate-50 dark:bg-slate-800 shadow-md overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.35, 1] }}
      >
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:items-stretch">
        <motion.div
          className="flex min-h-0 flex-col border-gray-200 dark:border-slate-600 lg:w-xl lg:flex-shrink-0 lg:border-r xl:w-2xl"
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.08, ease: [0.25, 0.1, 0.35, 1] }}
        >
          <div className="flex flex-col gap-3 p-4 pb-0 flex-shrink-0">
            <div className="flex flex-row items-center justify-between gap-3 min-w-0">
              <h2 className="flex min-w-0 items-center gap-2 font-bold text-2xl text-gray-700 dark:text-gray-200">
                <LayoutDashboard size={24} aria-hidden="true" className="shrink-0" />
                <span className="truncate">Overview</span>
              </h2>
              <button
                type="button"
                onClick={() => void handleAddNew()}
                className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                <Plus size={18} aria-hidden />
                Add New
              </button>
            </div>
            <div className="flex min-w-0 w-full items-center gap-1 rounded-lg border border-gray-300 bg-white pl-2 pr-2 dark:border-slate-500 dark:bg-slate-800">
              <Search size={18} className="flex-shrink-0 text-gray-400 dark:text-gray-400" aria-hidden />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-transparent p-2 text-sm text-gray-800 outline-none placeholder-gray-500 dark:text-gray-200 dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 pt-3">
            <OverviewSection
              pipelineTotal={pipelineTotal}
              applyingCount={applyingCount}
              appliedCount={appliedCount}
              setFilterStatus={setFilterStatus}
              embedded
              embeddedExtras={
                <>
                  <div className="hidden lg:block">
                    <ProgressSection
                      resumeCount={waitingCount}
                      totalActive={activeJobs.length}
                      interviewCount={interviewCount}
                      setFilterStatus={setFilterStatusFromFilter}
                      embedded
                      currentStatus={filterStatus}
                    />
                  </div>
                  <div className="dashboard-cta-desktop-only mt-4">
                    <FindJobsCtaCard
                      onFindJobs={() => setShowJobSearch(true)}
                    />
                  </div>
                </>
              }
            />
          </div>
        </motion.div>

        {/* Right column: same structure as left (title + scrollable content) */}
        <motion.div
          className="flex min-h-0 min-w-0 flex-1 flex-col pb-4 lg:pb-0"
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
          <div className="flex-1 min-h-0 overflow-y-auto p-4 pt-3 lg:max-h-[calc(100vh-12rem)]">
            <JobList
              jobs={filteredJobs}
              onDelete={onDelete}
              singleColumn
            />
          </div>
        </motion.div>
        </div>

        <div className="dashboard-cta-mobile-only shrink-0 border-t border-gray-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-800/90 sm:p-4">
          <FindJobsCtaCard onFindJobs={() => setShowJobSearch(true)} />
        </div>
      </motion.div>

      {showJobSearch && (
        <JobSearchModal onClose={() => setShowJobSearch(false)} />
      )}
      {newJobUi === "picker" && (
        <NewJobModePicker
          onClose={() => setNewJobUi(null)}
          onSelectStandard={() => setNewJobUi("standard")}
          onSelectSimple={() => setNewJobUi("simple")}
        />
      )}
      {newJobUi === "standard" && (
        <NewJobModal
          onClose={() => { clearSharedData(); setNewJobUi(null); }}
          onCreated={(job: Job) => {
            clearSharedData();
            setJobs((prev) => upsertJobList(prev, job));
            setAllJobs((prev) => upsertJobList(prev, job));
            setNewJobUi(null);
          }}
          onXpGained={handleXpGained}
        />
      )}
      {newJobUi === "simple" && (
        <SimpleNewJobModal
          onClose={() => setNewJobUi(null)}
          onSwitchToStandard={() => setNewJobUi("standard")}
          onCreated={(job: Job) => {
            setJobs((prev) => upsertJobList(prev, job));
            setAllJobs((prev) => upsertJobList(prev, job));
            setNewJobUi(null);
          }}
        />
      )}

      <XpToast
        xp={xpToast}
        onDismiss={() => setXpToast(0)}
      />
    </section>
  );
}
