import { prisma } from "@/lib/prisma";
import { getCategoryLabel } from "@/lib/constants/categories";
import type { AdminAnalytics } from "./types";

const OFFER_STATUS = "offer";
const ACTIVE_WINDOW_DAYS = 3;
const INACTIVE_THRESHOLD_DAYS = 14;
const INTERVIEW_STATUSES = ["interview1", "interview2", "interview3"];

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Aggregated analytics for /admin/analytics.
 * Single-pass over users + jobs — no N+1.
 */
export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const activeWindowStart = daysAgo(ACTIVE_WINDOW_DAYS);
  const inactiveThreshold = daysAgo(INACTIVE_THRESHOLD_DAYS);

  const students = await prisma.user.findMany({
    where: { OR: [{ hubStatus: null }, { hubStatus: { not: "STAFF" } }] },
    select: {
      id: true,
      category: true,
      jobs: {
        // Include terminal-status jobs (offer/rejected) even though they are
        // soft-deleted by design — excluding them would make hiredRate always 0.
        where: { OR: [{ deletedAt: null }, { status: { in: [OFFER_STATUS, "rejected"] } }] },
        select: { status: true },
      },
      xp: {
        select: {
          events: {
            where: {
              reason: "DAILY_ACTIVITY",
              createdAt: { gte: inactiveThreshold },
            },
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  // Application status distribution (all non-deleted jobs across all students)
  const statusDistribution = await prisma.job.groupBy({
    by: ["status"],
    where: {
      deletedAt: null,
      user: { OR: [{ hubStatus: null }, { hubStatus: { not: "STAFF" } }] },
    },
    _count: { _all: true },
  });

  const STATUS_ORDER = [
    "applying", "resume", "interview1", "interview2", "interview3", "offer", "rejected",
  ];
  const applicationsByStatus = statusDistribution
    .map((g) => ({ status: g.status, count: g._count._all }))
    .sort((a, b) => {
      const ai = STATUS_ORDER.indexOf(a.status);
      const bi = STATUS_ORDER.indexOf(b.status);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  // Per-user aggregation
  const categoryMap = new Map<string, number>();
  let hiredCount = 0;
  let activeCount = 0;
  let inactiveCount = 0;
  let usersReachedInterview = 0;

  for (const u of students) {
    const isHired = u.jobs.some((j) => j.status === OFFER_STATUS);
    const lastEvent = u.xp?.events[0] ?? null;
    const isActive =
      !isHired &&
      lastEvent !== null &&
      lastEvent.createdAt >= activeWindowStart;
    if (isHired) hiredCount++;
    else if (isActive) activeCount++;
    else inactiveCount++;

    const hasInterview = u.jobs.some((j) =>
      INTERVIEW_STATUSES.includes(j.status)
    );
    if (!isHired && hasInterview) usersReachedInterview++;

    const key = u.category ?? "not_set";
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
  }

  const totalStudents = students.length;
  const hiredRate = totalStudents > 0 ? hiredCount / totalStudents : 0;
  const nonHired = totalStudents - hiredCount;
  const interviewRate = nonHired > 0 ? usersReachedInterview / nonHired : 0;

  const usersByTrack = Array.from(categoryMap.entries())
    .map(([cat, count]) => ({
      label: cat === "not_set" ? "Not set" : getCategoryLabel(cat),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    usersByTrack,
    applicationsByStatus,
    hiredRate,
    hiredCount,
    totalStudents,
    userSegments: { active: activeCount, hired: hiredCount, inactive: inactiveCount },
    interviewRate,
  };
}
