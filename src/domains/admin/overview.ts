import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCategoryLabel } from "@/lib/constants/categories";
import {
  ACTIVE_WINDOW_DAYS,
  INACTIVE_THRESHOLD_DAYS,
  STUCK_THRESHOLD_DAYS,
  PREVIEW_LIMIT,
  OFFER_STATUS,
  STUCK_STATUSES,
} from "./config";
import type {
  AdminOverview,
  CategoryCount,
  ActiveUserPreview,
  SupportUserPreview,
  StuckUserPreview,
  HiredUserPreview,
} from "./types";

// Shared where clause — excludes STAFF users
const NON_STAFF_WHERE = {
  OR: [{ hubStatus: null as null }, { hubStatus: { not: "STAFF" as const } }],
};

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Fetch all data needed for the Admin Overview.
 * Runs two queries in parallel:
 *   1. prisma.user.groupBy — DB-level category distribution (no JS aggregation needed)
 *   2. prisma.user.findMany — focused user data for count metrics and preview lists
 *
 * Not exported directly — wrapped with unstable_cache below.
 */
async function getAdminOverviewRaw(): Promise<AdminOverview> {
  const activeWindowStart = daysAgo(ACTIVE_WINDOW_DAYS);
  const inactiveThreshold = daysAgo(INACTIVE_THRESHOLD_DAYS);
  const stuckThreshold = daysAgo(STUCK_THRESHOLD_DAYS);

  // ── Parallel queries ───────────────────────────────────────────────────────
  const [categoryGroups, students] = await Promise.all([
    // 1. DB-level category distribution — avoids JS aggregation loop
    prisma.user.groupBy({
      by: ["category"],
      where: NON_STAFF_WHERE,
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
    }),

    // 2. User data for count metrics and preview lists
    prisma.user.findMany({
      where: NON_STAFF_WHERE,
      select: {
        id: true,
        name: true,
        email: true,
        category: true,
        jobs: {
          // Include terminal-status jobs (offer/rejected) even though they are
          // soft-deleted by design — excluding them would make hiredRate always 0.
          where: { OR: [{ deletedAt: null }, { status: { in: [OFFER_STATUS, "rejected"] } }] },
          select: { id: true, status: true, appliedAt: true },
        },
        xp: {
          select: {
            id: true,
            events: {
              where: {
                reason: "DAILY_ACTIVITY",
                createdAt: { gte: daysAgo(INACTIVE_THRESHOLD_DAYS) },
              },
              select: { createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    }),
  ]);

  // ── Scalar metrics ─────────────────────────────────────────────────────────

  const activeUserIds = new Set<string>();
  const hiredUserIds = new Set<string>();

  for (const u of students) {
    const lastEvent = u.xp?.events[0];
    if (lastEvent && lastEvent.createdAt >= activeWindowStart) {
      activeUserIds.add(u.id);
    }
    if (u.jobs.some((j) => j.status === OFFER_STATUS)) {
      hiredUserIds.add(u.id);
    }
  }

  let stuckApplicationsCount = 0;
  for (const u of students) {
    if (hiredUserIds.has(u.id)) continue;
    for (const job of u.jobs) {
      if (
        STUCK_STATUSES.includes(job.status as (typeof STUCK_STATUSES)[number]) &&
        job.appliedAt < stuckThreshold
      ) {
        stuckApplicationsCount++;
      }
    }
  }

  let needsSupportCount = 0;
  for (const u of students) {
    if (hiredUserIds.has(u.id)) continue;
    const hasJobs = u.jobs.length > 0;
    const lastEvent = u.xp?.events[0];
    const isInactive = !lastEvent || lastEvent.createdAt < inactiveThreshold;
    if (!hasJobs || isInactive) needsSupportCount++;
  }

  // ── Category distribution — from groupBy result ────────────────────────────
  const categoryDistribution: CategoryCount[] = categoryGroups
    .map((g) => ({
      category: g.category ?? "not_set",
      label: g.category === null ? "Not set" : getCategoryLabel(g.category),
      count: (g._count as { _all?: number })._all ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Active users by category — in-memory, no extra DB query ───────────────
  const activeCategoryMap = new Map<string, number>();
  for (const u of students) {
    if (!activeUserIds.has(u.id)) continue;
    const key = u.category ?? "not_set";
    activeCategoryMap.set(key, (activeCategoryMap.get(key) ?? 0) + 1);
  }
  const activeCategoryDistribution: CategoryCount[] = Array.from(activeCategoryMap.entries())
    .map(([category, count]) => ({
      category,
      label: category === "not_set" ? "Not set" : getCategoryLabel(category),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Preview lists ──────────────────────────────────────────────────────────

  const topActiveUsers: ActiveUserPreview[] = students
    .filter((u) => activeUserIds.has(u.id))
    .slice(0, PREVIEW_LIMIT)
    .map((u) => ({ id: u.id, name: u.name, email: u.email, category: u.category }));

  const topSupportUsers: SupportUserPreview[] = [];
  for (const u of students) {
    if (hiredUserIds.has(u.id)) continue;
    const hasJobs = u.jobs.length > 0;
    const lastEvent = u.xp?.events[0];
    const isInactive = !lastEvent || lastEvent.createdAt < inactiveThreshold;
    if (!hasJobs || isInactive) {
      topSupportUsers.push({
        id: u.id,
        name: u.name,
        email: u.email,
        reason: !hasJobs ? "no_jobs" : "inactive",
      });
    }
  }
  topSupportUsers.sort(
    (a, b) => (a.reason === "no_jobs" ? -1 : 1) - (b.reason === "no_jobs" ? -1 : 1)
  );
  const topSupportUsersPreview = topSupportUsers.slice(0, PREVIEW_LIMIT);

  const stuckUsers: StuckUserPreview[] = [];
  for (const u of students) {
    if (hiredUserIds.has(u.id)) continue;
    const stuckJobCount = u.jobs.filter(
      (j) =>
        STUCK_STATUSES.includes(j.status as (typeof STUCK_STATUSES)[number]) &&
        j.appliedAt < stuckThreshold
    ).length;
    if (stuckJobCount > 0) {
      stuckUsers.push({ id: u.id, name: u.name, email: u.email, applicationCount: stuckJobCount });
    }
  }
  stuckUsers.sort((a, b) => b.applicationCount - a.applicationCount);
  const stuckUsersCount = stuckUsers.length;
  const topStuckUsers = stuckUsers.slice(0, PREVIEW_LIMIT);

  const topHiredUsers: HiredUserPreview[] = students
    .filter((u) => hiredUserIds.has(u.id))
    .slice(0, PREVIEW_LIMIT)
    .map((u) => ({ id: u.id, name: u.name, email: u.email, category: u.category }));

  const totalStudents = students.length;
  const hiredCount = hiredUserIds.size;

  return {
    currentlyActiveUsers: activeUserIds.size,
    totalStudents,
    hiredCount,
    hiredRate: totalStudents > 0 ? hiredCount / totalStudents : 0,
    stuckApplicationsCount,
    stuckUsersCount,
    needsSupportCount,
    categoryDistribution,
    activeCategoryDistribution,
    topActiveUsers,
    topSupportUsers: topSupportUsersPreview,
    topStuckUsers,
    topHiredUsers,
  };
}

/**
 * Admin Overview — cached for 5 minutes.
 * On cache hit: zero DB queries.
 * On cache miss: two parallel queries (groupBy + findMany).
 */
export const getAdminOverview = unstable_cache(
  getAdminOverviewRaw,
  ["admin-overview"],
  { revalidate: 300 }
);
