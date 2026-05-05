// Pure stats transformation functions — no DB or React dependency.
// Used by src/app/dashboard/stats/page.tsx to derive chart data.

export interface StatsBarEntry {
  key: string;
  label: string;
  count: number;
  color: string;
}

/** Minimal job shape required by stats transforms. */
export interface StatsJobInput {
  status: string;
  deletedAt?: Date | string | null;
  cycleEndStage?: string | null;
}

// ── Colour palette (matches existing STATUS_COLORS in page.tsx) ───────────────
const STATUS_COLORS: Record<string, string> = {
  applying: "#64748b",
  resume: "#9fa8b7",
  interview1: "#5694f7",
  interview2: "#4625cb",
  interview3: "#a213b2",
  offer: "#10b981",
};

const CYCLE_END_COLORS: Record<string, string> = {
  applying: "#64748b",
  resume: "#9fa8b7",
  interview1: "#5694f7",
  interview2: "#4625cb",
  interview3: "#a213b2",
  offer: "#10b981",
};

// ── Label helpers ─────────────────────────────────────────────────────────────

const CURRENT_LABELS: Record<string, string> = {
  applying: "Applying",
  resume: "Applied",
  interview1: "Interview 1",
  interview2: "Interview 2",
  interview3: "Interview 3",
};

const CYCLE_END_LABELS: Record<string, string> = {
  applying: "Ended at Applied",
  resume: "Ended at Applied",
  interview1: "Ended at Interview 1",
  interview2: "Ended at Interview 2",
  interview3: "Ended at Interview 3",
  offer: "Ended at Offer",
};

const TERMINAL_STATUSES = new Set(["offer", "rejected"]);
const ACTIVE_PIPELINE = ["applying", "resume", "interview1", "interview2", "interview3"];

// ── Current tab ───────────────────────────────────────────────────────────────

/**
 * Builds bar entries for the Current tab.
 * Counts active (non-deleted, non-terminal) jobs by their current status.
 */
export function buildCurrentStatusEntries(jobs: StatsJobInput[]): StatsBarEntry[] {
  const active = jobs.filter(
    (j) => j.deletedAt == null && !TERMINAL_STATUSES.has(j.status),
  );

  return ACTIVE_PIPELINE.map((status) => ({
    key: status,
    label: CURRENT_LABELS[status] ?? status,
    count: active.filter((j) => j.status === status).length,
    color: STATUS_COLORS[status] ?? "#94a3b8",
  }));
}

// ── Cycle End tab ─────────────────────────────────────────────────────────────

/**
 * Builds bar entries for the Cycle End tab.
 * Only considers closed jobs (status === offer | rejected).
 * Uses cycleEndStage to determine where the cycle ended.
 * Falls back to "applying" when cycleEndStage is null (cycle closed immediately).
 */
export function buildCycleEndEntries(allJobs: StatsJobInput[]): StatsBarEntry[] {
  const closed = allJobs.filter((j) => TERMINAL_STATUSES.has(j.status));

  const ORDER = ["applying", "resume", "interview1", "interview2", "interview3", "offer"];

  const counts: Record<string, number> = {};
  for (const job of closed) {
    // null cycleEndStage means the job closed from the applying stage
    const stage = job.cycleEndStage ?? "applying";
    counts[stage] = (counts[stage] ?? 0) + 1;
  }

  return ORDER.filter((stage) => (counts[stage] ?? 0) > 0).map((stage) => ({
    key: stage,
    label: CYCLE_END_LABELS[stage] ?? `Ended at ${stage}`,
    count: counts[stage] ?? 0,
    color: CYCLE_END_COLORS[stage] ?? "#94a3b8",
  }));
}

/**
 * Total number of closed cycles (offer or rejected).
 */
export function countClosedCycles(allJobs: StatsJobInput[]): number {
  return allJobs.filter((j) => TERMINAL_STATUSES.has(j.status)).length;
}
