// Pure helpers to compute derived dashboard metrics

import type { Job } from "@/generated/prisma";

export const isFinal = (j: Job) =>
  j.status === "offer" || j.status === "rejected";

/** Treat missing `deletedAt` (e.g. from JSON) as active, same as null */
export const isActive = (j: Job) => j.deletedAt == null;

export const STALE_MS = 7 * 24 * 60 * 60 * 1000;

/** True when an applying job has been untouched for 7+ days (belongs on the stale-applying page).
 *  Uses toDate() to handle JSON-deserialized string dates safely. */
export const isStaleApplying = (j: Job): boolean => {
  if (j.status !== "applying") return false;
  const created = toDate(j.createdAt);
  return created !== null && Date.now() - created.getTime() > STALE_MS;
};

export function activeOnly(all: Job[]) {
  if (!Array.isArray(all)) {
    console.warn("activeOnly received non-array:", all);
    return [];
  }
  return all.filter(isActive);
}

export function statusCountsActive(active: Job[]) {
  if (!Array.isArray(active)) {
    console.warn("statusCountsActive received non-array:", active);
    return {};
  }
  return active.reduce<Record<string, number>>((acc, j) => {
    if (!isFinal(j)) acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {});
}

export function startEndOfToday(now: Date = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val as string | number);
  return isNaN(d.getTime()) ? null : d;
}

export function countToday(all: Job[]) {
  if (!Array.isArray(all)) {
    console.warn("countToday received non-array:", all);
    return 0;
  }
  const { start, end } = startEndOfToday();
  return all.filter((j) => {
    const d = toDate((j as Job & { createdAt?: unknown }).createdAt);
    return d !== null && d >= start && d <= end;
  }).length;
}

export function countDecided(all: Job[]) {
  if (!Array.isArray(all)) {
    console.warn("countDecided received non-array:", all);
    return 0;
  }
  return all.filter(isFinal).length;
}

export function countWaitingActive(active: Job[]) {
  if (!Array.isArray(active)) {
    console.warn("countWaitingActive received non-array:", active);
    return 0;
  }
  // Now treating "applying" as the waiting/initial stage
  return active.filter((j) => j.status === "applying").length;
}

/** Dashboard list filters. `postApplying` = every stage past Applying; `interviews` = any interview round. */
export type StatusFilter =
  | "all"
  | "applying"
  | "postApplying"
  | "resume"
  | "interviews"
  | "interview1"
  | "interview2"
  | "interview3";

const INTERVIEW_STATUSES = new Set(["interview1", "interview2", "interview3"]);

export function matchesStatusFilter(job: Job, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "postApplying") return job.status !== "applying";
  if (filter === "interviews") return INTERVIEW_STATUSES.has(job.status);
  return job.status === filter;
}

export type DashboardCounts = {
  /** Active cards still in the pipeline (not offer/rejected). */
  total: number;
  /** Applying stage, stale cards included. */
  applying: number;
  /** Applying cards untouched for 7+ days (shown as the stacked card, not in the list). */
  stale: number;
  /** Every pipeline card past Applying (Applied + interviews). */
  submitted: number;
  /** Applied stage only (`resume`). */
  applied: number;
  /** Any interview round. */
  interviews: number;
};

/** Single source for every number on the dashboard, so Overview, Progress and the list chip agree. */
export function dashboardCounts(active: Job[]): DashboardCounts {
  const list = activeOnly(active);
  const byStatus = statusCountsActive(list);
  const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
  const applying = byStatus["applying"] ?? 0;
  return {
    total,
    applying,
    stale: list.filter(isStaleApplying).length,
    submitted: total - applying,
    applied: byStatus["resume"] ?? 0,
    interviews:
      (byStatus["interview1"] ?? 0) +
      (byStatus["interview2"] ?? 0) +
      (byStatus["interview3"] ?? 0),
  };
}
