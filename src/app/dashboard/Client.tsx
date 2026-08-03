"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutList, LayoutDashboard, Search, Plus } from "lucide-react";
import { toast } from "sonner";

// Dashboard-local pieces
import OverviewSection from "@/app/dashboard/components/OverviewSection";
import ProgressSection from "@/app/dashboard/components/ProgressSection";
import JobList from "@/app/dashboard/components/JobList";
import JobListSkeleton from "@/app/dashboard/components/JobListSkeleton";
import EmptyPipelineState from "@/app/dashboard/components/EmptyPipelineState";
import NoMatchingJobsState from "@/app/dashboard/components/NoMatchingJobsState";
import NewJobModal from "@/app/dashboard/components/NewJobModal";
import NewJobModePicker from "@/app/dashboard/components/NewJobModePicker";
import SimpleNewJobModal from "@/app/dashboard/components/SimpleNewJobModal";
import JobSearchModal from "@/app/dashboard/components/JobSearchModal";
import FindJobsCtaCard from "@/app/dashboard/components/FindJobsCtaCard";
import MissionsSection from "@/app/dashboard/components/MissionsSection";
import InterviewDrillCtaButton from "@/app/dashboard/components/InterviewDrillCtaButton";
import StackedApplyingCard from "@/components/StackedApplyingCard";
import type { MissionsPayload, MissionStatus } from "@/lib/xp/missionsDisplayCore";
import XpSummaryCard from "@/app/dashboard/components/XpSummaryCard";
import DashboardStreakPanel from "@/app/dashboard/components/DashboardStreakPanel";
import XpToast from "@/components/XpToast";
import HiredBadge, { type ActiveOffer } from "@/components/HiredBadge";
import OfferCompletionFlow from "@/components/OfferCompletionFlow";
import type { PendingOffer } from "@/app/api/hired/offers/pending/route";
import { computeLevel } from "@/lib/xp/levels";
import { computeLoginStreakDisplay, type WeekCircleDay } from "@/lib/xp/streakDisplayCore";
import { useJobs } from "@/app/dashboard/hooks/useJobs";
import { useAllJobs } from "@/app/dashboard/hooks/useAllJobs";
import { useSharedEntry } from "@/app/dashboard/hooks/useSharedEntry";
import { useSharedDataStore } from "@/stores/useSharedDataStore";
import {
  activeOnly,
  countWaitingActive,
  isFinal,
  isStaleApplying,
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

type DashboardHeaderSummaryPayload = {
  totalXp: number;
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  progress: number;
  loginStreak: number;
  weekDays: WeekCircleDay[];
};

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
  const { jobs, setJobs, loading: jobsLoading } = useJobs();
  const { allJobs, setAllJobs } = useAllJobs();

  // Ensure arrays are always arrays (defensive programming)
  const safeJobs = useMemo(() => (Array.isArray(jobs) ? jobs : []), [jobs]);
  const safeAllJobs = useMemo(() => (Array.isArray(allJobs) ? allJobs : []), [allJobs]);

  // Derived sets and counts
  const activeJobs = useMemo(() => activeOnly(safeJobs), [safeJobs]);
  /** Stale applying cards excluded — used for individual card rendering only. */
  const freshActiveJobs = useMemo(
    () => activeJobs.filter((j) => !isStaleApplying(j)),
    [activeJobs],
  );
  /** Client-side count of stale applying cards (drives StackedApplyingCard visibility). */
  const staleCount = useMemo(
    () => activeJobs.filter(isStaleApplying).length,
    [activeJobs],
  );
  // Overview counts include stale applying so totals are accurate
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
    () => countWaitingActive(freshActiveJobs),
    [freshActiveJobs],
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
  const [drillStatus, setDrillStatus] = useState<MissionStatus>("not_started");
  const [allDailyDone, setAllDailyDone] = useState(false);
  /** True while daily_interview_drill mission is in the list and not yet completed. */
  const [drillMissionActive, setDrillMissionActive] = useState(false);
  const [headerSummary, setHeaderSummary] = useState<DashboardHeaderSummaryPayload | null>(
    null,
  );

  // Hired badge + offer completion state
  const [activeOffer, setActiveOffer] = useState<ActiveOffer | null | undefined>(undefined);
  const [pendingOffers, setPendingOffers] = useState<PendingOffer[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/hired/offers/active", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { offer: ActiveOffer | null };
        if (cancelled) return;
        setActiveOffer(data.offer);
        // Only prompt completion flow when user has no active hired offer
        if (!data.offer) {
          const pendingRes = await fetch("/api/hired/offers/pending", { cache: "no-store" });
          if (!pendingRes.ok || cancelled) return;
          const pendingData = (await pendingRes.json()) as { offers: PendingOffer[] };
          if (!cancelled) setPendingOffers(pendingData.offers);
        }
      } catch {
        if (!cancelled) setActiveOffer(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    void (async () => {
      try {
        const res = await fetch(
          `/api/xp/summary?timeZone=${encodeURIComponent(tz)}`,
          { cache: "no-store", credentials: "same-origin" },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as DashboardHeaderSummaryPayload;
        if (!cancelled) setHeaderSummary(data);
      } catch {
        const streak = computeLoginStreakDisplay(new Date(), tz, new Set());
        const lv = computeLevel(0);
        if (!cancelled) {
          setHeaderSummary({
            totalXp: 0,
            level: lv.level,
            currentLevelXp: lv.currentLevelXp,
            xpToNextLevel: lv.xpToNextLevel,
            progress: lv.progress,
            loginStreak: streak.loginStreak,
            weekDays: streak.weekDays,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [xpRefreshToken]);

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

  // Filtered list — active, non-finalized, stale applying excluded
  const filteredJobs = useMemo(() => {
    return freshActiveJobs
      .filter((job) => !isFinal(job))
      .filter((job) => {
        const q = searchTerm.toLowerCase();
        const company = (job.company ?? "").toLowerCase();
        const title = (job.title ?? "").toLowerCase();
        const matchesSearch = company.includes(q) || title.includes(q);
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "postApplying" && job.status !== "applying") ||
          job.status === filterStatus;
        return matchesSearch && matchesStatus;
      });
  }, [freshActiveJobs, searchTerm, filterStatus]);

  /**
   * Card List has three distinct zero-row states. `hasNoJobsAtAll` keys off the
   * unfiltered list (including stale applying cards, which render as the stacked
   * card) so an existing user narrowing a filter never sees the first-job invite.
   */
  const hasNoJobsAtAll = useMemo(
    () => activeJobs.filter((j) => !isFinal(j)).length === 0,
    [activeJobs],
  );
  /** The stacked stale-applying card occupies the list area on its own. */
  const stackedCardVisible =
    staleCount > 0 && (filterStatus === "all" || filterStatus === "applying");
  const showNoMatches =
    !hasNoJobsAtAll && filteredJobs.length === 0 && !stackedCardVisible;

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
  };

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
      toast.error("Failed to delete job");
    }
  };

  return (
    <section className="flex min-h-screen flex-col p-4 sm:px-6 sm:py-2">
      {/* Header + compact XP (actions moved to sidebar / mobile menu) */}
      <div
        className="relative mb-3 flex flex-shrink-0 flex-col gap-3 overflow-hidden rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-600 to-indigo-700 p-4 shadow-[0_10px_28px_-6px_rgba(109,40,217,0.55),0_0_0_1px_rgba(255,255,255,0.2)_inset,0_-1px_0_0_rgba(0,0,0,0.15)_inset] ring-2 ring-cyan-200/45 dark:from-fuchsia-600 dark:via-violet-600 dark:to-sky-800 dark:shadow-[0_12px_32px_-8px_rgba(76,29,149,0.65),0_0_0_1px_rgba(255,255,255,0.12)_inset] dark:ring-cyan-400/30 sm:p-5 md:flex-row md:items-start md:justify-between"
      >
        <span
          className="pointer-events-none absolute -left-1/4 top-0 h-[200%] w-2/3 -rotate-12 bg-gradient-to-r from-white/25 via-white/5 to-transparent dark:from-white/18"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -bottom-20 right-0 h-44 w-44 rounded-full bg-cyan-400/35 blur-3xl dark:bg-sky-400/22"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -right-10 -top-20 h-40 w-40 rounded-full bg-fuchsia-400/40 blur-3xl dark:bg-fuchsia-500/28"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/65 to-transparent dark:via-white/38"
          aria-hidden
        />
        <div className="relative z-[1] flex w-full flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-x-10 lg:gap-x-14 xl:gap-x-20">
          <div className="min-w-0 md:pr-2">
            <h1 className="mb-2 text-xl font-bold text-white drop-shadow-sm sm:text-3xl">
              Welcome,{" "}
              <span className="text-yellow-300 dark:text-yellow-200">{user.name}</span>
            </h1>
            <DashboardStreakPanel
              loading={headerSummary === null}
              data={
                headerSummary
                  ? {
                      loginStreak: headerSummary.loginStreak,
                      weekDays: headerSummary.weekDays,
                    }
                  : null
              }
            />
          </div>
          <div className="w-full shrink-0 md:w-[24rem] md:justify-self-end">
            <XpSummaryCard
              variant="inline"
              refreshToken={xpRefreshToken}
              skipInternalFetch
              xpFromParent={
                headerSummary
                  ? {
                      totalXp: headerSummary.totalXp,
                      level: headerSummary.level,
                      currentLevelXp: headerSummary.currentLevelXp,
                      xpToNextLevel: headerSummary.xpToNextLevel,
                      progress: headerSummary.progress,
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      {activeOffer && (
        <div className="mb-3">
          <HiredBadge
            offer={activeOffer}
            onDeactivated={() => setActiveOffer(null)}
          />
        </div>
      )}

      {pendingOffers && pendingOffers.length > 0 && (
        <OfferCompletionFlow
          offers={pendingOffers}
          onDone={() => {
            setPendingOffers(null);
            // Refresh active offer in case the completed offer is now verified
            void fetch("/api/hired/offers/active", { cache: "no-store" })
              .then((r) => r.ok ? r.json() : null)
              .then((data: { offer: ActiveOffer | null } | null) => {
                if (data) setActiveOffer(data.offer);
              })
              .catch(() => undefined);
          }}
        />
      )}

      <MissionsSection
        refreshToken={xpRefreshToken}
        /* Gated on !jobsLoading so users who do have jobs never see it
           collapse and then expand. */
        collapsedByDefault={!jobsLoading && hasNoJobsAtAll}
        onStartNewJob={() => void handleAddNew()}
        onXpActivity={() => setXpRefreshToken((t) => t + 1)}
        onPayloadChange={(payload: MissionsPayload) => {
          const drill = payload.daily.find((m) => m.id === "daily_interview_drill");
          setDrillStatus((drill?.status as MissionStatus) ?? "not_started");
          setAllDailyDone(payload.dailyRemaining === 0);
          // Hide the standalone CTA button while the drill mission is actionable
          setDrillMissionActive(!!drill && !drill.completed);
        }}
      />
      <InterviewDrillCtaButton
        drillStatus={drillStatus}
        allDailyDone={allDailyDone}
        hiddenByMission={drillMissionActive}
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
              <h2 className="flex min-w-0 items-center gap-2 font-display font-bold text-2xl text-gray-700 dark:text-gray-200">
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
                aria-label="Search jobs"
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
          <h2 className="flex items-center gap-2 font-display font-bold text-2xl text-gray-700 dark:text-gray-200 p-4 pb-0 flex-shrink-0">
            <LayoutList size={24} aria-hidden="true" />
            Card List
            {/* A "0" chip carries no information while loading or before the first job. */}
            {!jobsLoading && !hasNoJobsAtAll && (
              <motion.span
                key={filterStatus}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.35, 1] }}
                className={`text-xl font-semibold font-mono tabular-nums px-2 py-0.5 rounded-full ${
                  filterStatus === "applying"
                    ? "text-indigo-800 bg-indigo-100 dark:text-indigo-100 dark:bg-indigo-900/80"
                    : filterStatus === "postApplying"
                      ? "text-emerald-800 bg-emerald-100 dark:text-emerald-100 dark:bg-emerald-950/60"
                      : "text-gray-600 bg-gray-200 dark:text-gray-300 dark:bg-slate-600"
                }`}
              >
                {filteredJobs.length}
              </motion.span>
            )}
          </h2>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 pt-3 lg:max-h-[calc(100vh-12rem)]">
            {staleCount > 0 && (filterStatus === "all" || filterStatus === "applying") && (
              <StackedApplyingCard
                key={filterStatus}
                count={staleCount}
                onClick={() => router.push("/dashboard/jobs/stale-applying")}
              />
            )}
            {jobsLoading ? (
              <JobListSkeleton />
            ) : hasNoJobsAtAll ? (
              <EmptyPipelineState onAddFirstJob={() => void handleAddNew()} />
            ) : showNoMatches ? (
              <NoMatchingJobsState
                searchTerm={searchTerm}
                hasStatusFilter={filterStatus !== "all"}
                onClear={handleClearFilters}
              />
            ) : (
              <JobList
                jobs={filteredJobs}
                onDelete={onDelete}
                singleColumn
                filterKey={filterStatus}
              />
            )}
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
