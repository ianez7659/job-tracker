import { prisma } from "@/lib/prisma";
import { getCategoryLabel } from "@/lib/constants/categories";
import type {
  AdminOverview,
  CategoryCount,
  SupportUserPreview,
  StuckUserPreview,
  HiredUserPreview,
} from "./types";

const OFFER_STATUS = "offer";
const STUCK_STATUSES = ["applying", "resume"] as const;
const STUCK_THRESHOLD_DAYS = 14;
const INACTIVE_THRESHOLD_DAYS = 14;
const ACTIVE_WINDOW_DAYS = 3;

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Fetch all data needed for the Admin Overview in a single pass.
 * Excludes: soft-deleted jobs, STAFF users.
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  const activeWindowStart = daysAgo(ACTIVE_WINDOW_DAYS);
  const inactiveThreshold = daysAgo(INACTIVE_THRESHOLD_DAYS);
  const stuckThreshold = daysAgo(STUCK_THRESHOLD_DAYS);

  // 1. All non-STAFF users
  const students = await prisma.user.findMany({
    where: {
      OR: [{ hubStatus: null }, { hubStatus: { not: "STAFF" } }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      category: true,
      jobs: {
        where: { deletedAt: null },
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
  });

  // 2. Currently active users (DAILY_ACTIVITY within last 3 days)
  const activeUserIds = new Set<string>();
  for (const u of students) {
    const lastEvent = u.xp?.events[0];
    if (lastEvent && lastEvent.createdAt >= activeWindowStart) {
      activeUserIds.add(u.id);
    }
  }

  // 3. Hired users (any non-deleted job with status "offer")
  const hiredUserIds = new Set<string>();
  for (const u of students) {
    if (u.jobs.some((j) => j.status === OFFER_STATUS)) {
      hiredUserIds.add(u.id);
    }
  }

  // 4. Stuck applications (applying/resume, appliedAt older than 14 days, not hired user)
  let stuckCount = 0;
  for (const u of students) {
    if (hiredUserIds.has(u.id)) continue;
    for (const job of u.jobs) {
      if (
        STUCK_STATUSES.includes(job.status as (typeof STUCK_STATUSES)[number]) &&
        job.appliedAt < stuckThreshold
      ) {
        stuckCount++;
      }
    }
  }

  // 5. Users who may need support (14+ days inactive OR 0 jobs), hired excluded
  let needsSupportCount = 0;
  for (const u of students) {
    if (hiredUserIds.has(u.id)) continue;
    const hasJobs = u.jobs.length > 0;
    const lastEvent = u.xp?.events[0];
    const isInactive = !lastEvent || lastEvent.createdAt < inactiveThreshold;
    if (!hasJobs || isInactive) needsSupportCount++;
  }

  // 6. Category distribution
  const categoryMap = new Map<string, number>();
  for (const u of students) {
    const key = u.category ?? "not_set";
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
  }
  const categoryDistribution: CategoryCount[] = Array.from(categoryMap.entries())
    .map(([category, count]) => ({
      category,
      label: category === "not_set" ? "Not set" : getCategoryLabel(category),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const STUCK_APPLY_STATUSES = ["applying", "resume"];
  const ADVANCED_STATUSES = ["interview1", "interview2", "interview3", "offer"];
  const PREVIEW_LIMIT = 3;

  // Preview: top support users (no_jobs first, then inactive)
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
  topSupportUsers.sort((a, b) => (a.reason === "no_jobs" ? -1 : 1) - (b.reason === "no_jobs" ? -1 : 1));
  const topSupportUsersPreview = topSupportUsers.slice(0, PREVIEW_LIMIT);

  // Preview: stuck users (3+ applying/resume, no interview/offer)
  const stuckUsers: StuckUserPreview[] = [];
  for (const u of students) {
    if (hiredUserIds.has(u.id)) continue;
    const applyCount = u.jobs.filter((j) => STUCK_APPLY_STATUSES.includes(j.status)).length;
    const hasAdvanced = u.jobs.some((j) => ADVANCED_STATUSES.includes(j.status));
    if (applyCount >= 3 && !hasAdvanced) {
      stuckUsers.push({ id: u.id, name: u.name, email: u.email, applicationCount: applyCount });
    }
  }
  stuckUsers.sort((a, b) => b.applicationCount - a.applicationCount);
  const stuckUsersCount = stuckUsers.length;
  const topStuckUsers: StuckUserPreview[] = stuckUsers.slice(0, PREVIEW_LIMIT);

  // Preview: top hired users
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
    stuckApplicationsCount: stuckCount,
    stuckUsersCount,
    needsSupportCount,
    categoryDistribution,
    topSupportUsers: topSupportUsersPreview,
    topStuckUsers,
    topHiredUsers,
  };
}
