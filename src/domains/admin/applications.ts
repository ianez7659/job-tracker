import { prisma } from "@/lib/prisma";
import type { StuckApplication } from "./types";

const OFFER_STATUS = "offer";
const STUCK_STATUSES = ["applying", "resume"] as const;
const STUCK_THRESHOLD_DAYS = 14;

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Jobs stuck in applying/resume for 14+ days.
 * Excludes soft-deleted jobs and hired users.
 */
export async function getStuckApplications(): Promise<StuckApplication[]> {
  const stuckThreshold = daysAgo(STUCK_THRESHOLD_DAYS);
  const now = new Date();

  // Get hired user IDs to exclude
  const hiredUsers = await prisma.job.findMany({
    where: { status: OFFER_STATUS, deletedAt: null },
    select: { userId: true },
    distinct: ["userId"],
  });
  const hiredUserIds = new Set(hiredUsers.map((j) => j.userId));

  const stuckJobs = await prisma.job.findMany({
    where: {
      status: { in: [...STUCK_STATUSES] },
      appliedAt: { lt: stuckThreshold },
      deletedAt: null,
      userId: { notIn: [...hiredUserIds] },
      user: { OR: [{ hubStatus: null }, { hubStatus: { not: "STAFF" } }] },
    },
    select: {
      id: true,
      title: true,
      company: true,
      status: true,
      appliedAt: true,
      userId: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { appliedAt: "asc" },
  });

  return stuckJobs.map((j) => ({
    jobId: j.id,
    title: j.title,
    company: j.company,
    status: j.status,
    appliedAt: j.appliedAt,
    daysSinceApplied: Math.floor(
      (now.getTime() - j.appliedAt.getTime()) / 86400000
    ),
    userId: j.userId,
    userName: j.user.name,
    userEmail: j.user.email,
  }));
}

/**
 * Pipeline stage distribution — count of non-deleted jobs per status.
 * Excludes soft-deleted jobs and STAFF users.
 */
export async function getPipelineDistribution(): Promise<
  { status: string; count: number }[]
> {
  const groups = await prisma.job.groupBy({
    by: ["status"],
    where: {
      deletedAt: null,
      user: { OR: [{ hubStatus: null }, { hubStatus: { not: "STAFF" } }] },
    },
    _count: { _all: true },
  });

  const ORDER = ["applying", "resume", "interview1", "interview2", "interview3", "offer", "rejected"];

  return groups
    .map((g) => ({ status: g.status, count: g._count._all }))
    .sort((a, b) => {
      const ai = ORDER.indexOf(a.status);
      const bi = ORDER.indexOf(b.status);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
}
