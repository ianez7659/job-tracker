import { prisma } from "@/lib/prisma";
import { OFFER_STATUS, STUCK_STATUSES, STUCK_THRESHOLD_DAYS } from "./config";
import type { AdminApplication, StuckApplication } from "./types";

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

// ── getApplicationsPageForAdmin ───────────────────────────────────────────────

export interface ApplicationsPageParams {
  q?: string;
  status?: string;
  track?: string;
  sort?: "applied" | "updated" | "status";
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface ApplicationsPage {
  applications: AdminApplication[];
  total: number;
}

/**
 * Paginated, filtered, sorted applications for /admin/applications.
 * All filtering/sorting happens at DB level. Returns only the current page slice.
 */
export async function getApplicationsPageForAdmin(
  params: ApplicationsPageParams = {}
): Promise<ApplicationsPage> {
  const {
    q,
    status,
    track,
    sort = "applied",
    dir = "desc",
    page = 1,
    perPage = 20,
  } = params;

  const categoryFilter =
    track === "__not_set__"
      ? { category: null as null }
      : track
      ? { category: track }
      : {};

  const jobWhere = {
    deletedAt: null,
    user: {
      OR: [{ hubStatus: null }, { hubStatus: { not: "STAFF" as const } }],
      ...categoryFilter,
    },
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { company: { contains: q, mode: "insensitive" as const } },
            { title: { contains: q, mode: "insensitive" as const } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "updated"
      ? { createdAt: dir }
      : sort === "status"
      ? { status: dir }
      : { appliedAt: dir };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where: jobWhere,
      select: {
        id: true,
        title: true,
        company: true,
        status: true,
        appliedAt: true,
        createdAt: true,
        url: true,
        jd: true,
        tags: true,
        userId: true,
        user: { select: { name: true, email: true, category: true } },
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.job.count({ where: jobWhere }),
  ]);

  return {
    applications: jobs.map((j) => ({
      jobId: j.id,
      title: j.title,
      company: j.company,
      status: j.status,
      userId: j.userId,
      userName: j.user.name,
      userEmail: j.user.email,
      userCategory: j.user.category,
      appliedAt: j.appliedAt,
      updatedAt: j.createdAt,
      hasUrl: !!j.url,
      hasJd: !!j.jd,
      hasNotes: !!j.tags,
    })),
    total,
  };
}

/**
 * All non-deleted job cards for /admin/applications monitor.
 * Excludes STAFF users. Sorted by appliedAt desc.
 */
export async function getAllApplicationsForAdmin(): Promise<AdminApplication[]> {
  const jobs = await prisma.job.findMany({
    where: {
      deletedAt: null,
      user: { OR: [{ hubStatus: null }, { hubStatus: { not: "STAFF" } }] },
    },
    select: {
      id: true,
      title: true,
      company: true,
      status: true,
      appliedAt: true,
      createdAt: true,
      url: true,
      jd: true,
      tags: true,
      userId: true,
      user: { select: { name: true, email: true, category: true } },
    },
    orderBy: { appliedAt: "desc" },
  });

  return jobs.map((j) => ({
    jobId: j.id,
    title: j.title,
    company: j.company,
    status: j.status,
    userId: j.userId,
    userName: j.user.name,
    userEmail: j.user.email,
    userCategory: j.user.category,
    appliedAt: j.appliedAt,
    updatedAt: j.createdAt,
    hasUrl: !!j.url,
    hasJd: !!j.jd,
    hasNotes: !!j.tags,
  }));
}
