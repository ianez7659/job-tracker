import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getDailyPeriodKey,
  normalizePeriodKey,
} from "@/lib/xp/dailyPeriod";
import { computeLoginStreak } from "@/lib/xp/streakDisplayCore";
import { computeLevel } from "@/lib/xp/levels";
import {
  ACTIVE_WINDOW_DAYS,
  INACTIVE_THRESHOLD_DAYS,
  STREAK_LOOKBACK_DAYS,
  OFFER_STATUS,
  INTERVIEW_STATUSES,
  STUCK_STATUSES,
  STUCK_THRESHOLD_DAYS,
} from "./config";
import type {
  AdminUser,
  AdminUserDetail,
  AdminUserDetailJob,
  DetailedAdminUser,
  EmploymentStatus,
  RankedUser,
  SupportUser,
} from "./types";

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Returns all users for the admin user management table.
 * Sorted by createdAt desc (newest first).
 */
export async function getAllUsersForAdmin(): Promise<AdminUser[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      hubStatus: true,
      category: true,
      createdAt: true,
      jobs: {
        where: { deletedAt: null },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    hubStatus: u.hubStatus as AdminUser["hubStatus"],
    category: u.category,
    createdAt: u.createdAt,
    jobCount: u.jobs.length,
  }));
}

/**
 * Returns non-STAFF, non-hired users ranked by totalXp descending.
 * Login streak is computed from DAILY_ACTIVITY events (5am-anchor, same as user dashboard).
 * Batch fetches all XP events to avoid N+1.
 */
export async function getActiveJobSeekerRanking(limit = 20): Promise<RankedUser[]> {
  const now = new Date();
  const since = daysAgo(STREAK_LOOKBACK_DAYS);

  const users = await prisma.user.findMany({
    where: { OR: [{ hubStatus: null }, { hubStatus: { not: "STAFF" } }] },
    select: {
      id: true,
      name: true,
      email: true,
      category: true,
      xp: {
        select: {
          id: true,
          totalXp: true,
          currentLevel: true,
          dailyTimeZone: true,
          events: {
            where: { reason: "DAILY_ACTIVITY", createdAt: { gte: since } },
            select: { createdAt: true },
          },
        },
      },
      jobs: {
        where: { deletedAt: null },
        select: { status: true },
      },
    },
  });

  const nonHired = users.filter(
    (u) => !u.jobs.some((j) => j.status === OFFER_STATUS)
  );

  const ranked: RankedUser[] = nonHired
    .map((u) => {
      const xp = u.xp;
      const tz = xp?.dailyTimeZone ?? "UTC";
      const claimedKeys = new Set<string>(
        (xp?.events ?? []).map((e) =>
          normalizePeriodKey(getDailyPeriodKey(e.createdAt, tz))
        )
      );
      const loginStreak = computeLoginStreak(now, tz, claimedKeys);
      const lastEvent = (xp?.events ?? []).reduce<Date | null>((latest, e) => {
        return latest === null || e.createdAt > latest ? e.createdAt : latest;
      }, null);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        category: u.category,
        totalXp: xp?.totalXp ?? 0,
        currentLevel: computeLevel(xp?.totalXp ?? 0).level,
        lastActiveAt: lastEvent,
        loginStreak,
      };
    })
    .sort((a, b) => b.totalXp - a.totalXp)
    .slice(0, limit);

  return ranked;
}

/**
 * Users who may need support: no jobs OR 14+ days inactive.
 * Hired users excluded.
 */
export async function getSupportUsers(): Promise<SupportUser[]> {
  const inactiveThreshold = daysAgo(INACTIVE_THRESHOLD_DAYS);
  const now = new Date();

  const users = await prisma.user.findMany({
    where: { OR: [{ hubStatus: null }, { hubStatus: { not: "STAFF" } }] },
    select: {
      id: true,
      name: true,
      email: true,
      category: true,
      jobs: {
        where: { deletedAt: null },
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

  const result: SupportUser[] = [];

  for (const u of users) {
    const isHired = u.jobs.some((j) => j.status === OFFER_STATUS);
    if (isHired) continue;

    const hasJobs = u.jobs.length > 0;
    const lastEvent = u.xp?.events[0] ?? null;
    const isInactive = !lastEvent || lastEvent.createdAt < inactiveThreshold;

    if (!hasJobs || isInactive) {
      const daysSinceActive = lastEvent
        ? Math.floor((now.getTime() - lastEvent.createdAt.getTime()) / 86400000)
        : null;

      result.push({
        id: u.id,
        name: u.name,
        email: u.email,
        category: u.category,
        jobCount: u.jobs.length,
        lastActiveAt: lastEvent?.createdAt ?? null,
        daysSinceActive,
        reason: !hasJobs ? "no_jobs" : "inactive",
      });
    }
  }

  return result.sort((a, b) => {
    if (a.reason !== b.reason) return a.reason === "no_jobs" ? -1 : 1;
    return (b.daysSinceActive ?? 999) - (a.daysSinceActive ?? 999);
  });
}

// ── getDetailedUsersForAdmin (cached) ─────────────────────────────────────────

async function getDetailedUsersRaw(): Promise<DetailedAdminUser[]> {
  const now = new Date();
  const since = daysAgo(STREAK_LOOKBACK_DAYS);
  const activeWindowStart = daysAgo(ACTIVE_WINDOW_DAYS);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      hubStatus: true,
      category: true,
      createdAt: true,
      jobs: {
        where: { deletedAt: null },
        select: { status: true },
      },
      xp: {
        select: {
          totalXp: true,
          currentLevel: true,
          dailyTimeZone: true,
          events: {
            where: { reason: "DAILY_ACTIVITY", createdAt: { gte: since } },
            select: { createdAt: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => {
    const jobs = u.jobs;
    const isHired = jobs.some((j) => j.status === OFFER_STATUS);

    const xp = u.xp;
    const tz = xp?.dailyTimeZone ?? "UTC";
    const events = xp?.events ?? [];
    const claimedKeys = new Set<string>(
      events.map((e) => normalizePeriodKey(getDailyPeriodKey(e.createdAt, tz)))
    );
    const loginStreak = computeLoginStreak(now, tz, claimedKeys);
    const lastActiveAt = events.reduce<Date | null>(
      (latest, e) => (!latest || e.createdAt > latest ? e.createdAt : latest),
      null
    );
    const isActive = lastActiveAt !== null && lastActiveAt >= activeWindowStart;

    const employmentStatus: EmploymentStatus = isHired
      ? "hired"
      : isActive
      ? "active"
      : "inactive";

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      hubStatus: u.hubStatus as DetailedAdminUser["hubStatus"],
      category: u.category,
      createdAt: u.createdAt,
      employmentStatus,
      jobCounts: {
        total: jobs.length,
        applying: jobs.filter((j) => j.status === "applying").length,
        waiting: jobs.filter((j) => j.status === "resume").length,
        interview: jobs.filter((j) =>
          (INTERVIEW_STATUSES as readonly string[]).includes(j.status)
        ).length,
        rejected: jobs.filter((j) => j.status === "rejected").length,
        offered: jobs.filter((j) => j.status === OFFER_STATUS).length,
      },
      totalXp: xp?.totalXp ?? 0,
      currentLevel: computeLevel(xp?.totalXp ?? 0).level,
      loginStreak,
      lastActiveAt,
    };
  });
}

/**
 * unstable_cache wraps return values with JSON serialization, converting Date
 * objects to ISO strings. Re-hydrate Date fields after retrieval so callers
 * always receive proper Date instances regardless of cache state.
 */
const _cachedDetailedUsers = unstable_cache(
  getDetailedUsersRaw,
  ["admin-users-detailed"],
  { revalidate: 60, tags: ["admin-users-detailed"] }
);

/**
 * Full user table for /admin/users — cached for 60 seconds.
 * On cache hit: zero DB queries.
 */
export async function getDetailedUsersForAdmin(): Promise<DetailedAdminUser[]> {
  const data = await _cachedDetailedUsers();
  return data.map((u) => ({
    ...u,
    createdAt: new Date(u.createdAt),
    lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt) : null,
  }));
}

// ── getAdminUserDetail (cached) ───────────────────────────────────────────────

async function getAdminUserDetailRaw(userId: string): Promise<AdminUserDetail | null> {
  const now = new Date();
  const since = daysAgo(STREAK_LOOKBACK_DAYS);
  const inactiveThreshold = daysAgo(INACTIVE_THRESHOLD_DAYS);
  const stuckThreshold = daysAgo(STUCK_THRESHOLD_DAYS);

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      hubStatus: true,
      category: true,
      createdAt: true,
      jobs: {
        // Include terminal-status jobs (offer/rejected) even though they are
        // soft-deleted by design — excluding them would make offered count always 0.
        where: { OR: [{ deletedAt: null }, { status: { in: [OFFER_STATUS, "rejected"] } }] },
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
        },
        orderBy: { appliedAt: "desc" },
      },
      xp: {
        select: {
          totalXp: true,
          currentLevel: true,
          dailyTimeZone: true,
          events: {
            where: { reason: "DAILY_ACTIVITY", createdAt: { gte: since } },
            select: { createdAt: true },
          },
        },
      },
    },
  });

  if (!u) return null;

  const jobs = u.jobs;
  const isHired = jobs.some((j) => j.status === OFFER_STATUS);

  const xp = u.xp;
  const tz = xp?.dailyTimeZone ?? "UTC";
  const events = xp?.events ?? [];
  const claimedKeys = new Set<string>(
    events.map((e) => normalizePeriodKey(getDailyPeriodKey(e.createdAt, tz)))
  );
  const loginStreak = computeLoginStreak(now, tz, claimedKeys);
  const lastActiveAt = events.reduce<Date | null>(
    (latest, e) => (!latest || e.createdAt > latest ? e.createdAt : latest),
    null
  );
  const isActive = lastActiveAt !== null && lastActiveAt >= daysAgo(ACTIVE_WINDOW_DAYS);

  const employmentStatus: EmploymentStatus = isHired ? "hired" : isActive ? "active" : "inactive";

  const hasInterview = jobs.some((j) =>
    (INTERVIEW_STATUSES as readonly string[]).includes(j.status) || j.status === OFFER_STATUS
  );

  const detailJobs: AdminUserDetailJob[] = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    status: j.status,
    appliedAt: j.appliedAt,
    updatedAt: j.createdAt,
    hasUrl: !!j.url,
    hasJd: !!j.jd,
    hasNotes: !!j.tags,
  }));

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    hubStatus: u.hubStatus as AdminUserDetail["hubStatus"],
    category: u.category,
    createdAt: u.createdAt,
    employmentStatus,
    jobCounts: {
      total: jobs.length,
      applying: jobs.filter((j) => j.status === "applying").length,
      waiting: jobs.filter((j) => j.status === "resume").length,
      interview: jobs.filter((j) =>
        (INTERVIEW_STATUSES as readonly string[]).includes(j.status)
      ).length,
      rejected: jobs.filter((j) => j.status === "rejected").length,
      offered: jobs.filter((j) => j.status === OFFER_STATUS).length,
    },
    totalXp: xp?.totalXp ?? 0,
    currentLevel: computeLevel(xp?.totalXp ?? 0).level,
    loginStreak,
    lastActiveAt,
    jobs: detailJobs,
    signals: {
      noInterview: jobs.length >= 3 && !hasInterview,
      longStuck: jobs.some(
        (j) =>
          (STUCK_STATUSES as readonly string[]).includes(j.status) &&
          j.appliedAt < stuckThreshold
      ),
      lowActivity: !lastActiveAt || lastActiveAt < inactiveThreshold,
      missingJobInfo: jobs.filter((j) => !j.url || !j.jd).length,
    },
  };
}

/**
 * unstable_cache serializes Date fields to ISO strings. Re-hydrate all Date
 * fields so callers always receive proper Date instances.
 */
const _cachedUserDetail = unstable_cache(
  getAdminUserDetailRaw,
  ["admin-user-detail"],
  { revalidate: 30, tags: ["admin-user-detail"] }
);

/**
 * Full detail for a single user — used on /admin/users/[id].
 * Cached for 30 seconds per userId. Returns null if user not found.
 */
export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const data = await _cachedUserDetail(userId);
  if (!data) return null;
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    lastActiveAt: data.lastActiveAt ? new Date(data.lastActiveAt) : null,
    jobs: data.jobs.map((j) => ({
      ...j,
      appliedAt: new Date(j.appliedAt),
      updatedAt: new Date(j.updatedAt),
    })),
  };
}
