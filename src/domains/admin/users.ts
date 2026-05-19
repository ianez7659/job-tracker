import { prisma } from "@/lib/prisma";
import {
  getDailyPeriodKey,
  normalizePeriodKey,
} from "@/lib/xp/dailyPeriod";
import { computeLoginStreak } from "@/lib/xp/streakDisplayCore";
import type { RankedUser, SupportUser } from "./types";

const OFFER_STATUS = "offer";
const INACTIVE_THRESHOLD_DAYS = 14;
const STREAK_LOOKBACK_DAYS = 140;

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Returns non-STAFF, non-hired users ranked by totalXp descending.
 * Login streak is computed from DAILY_ACTIVITY events (5am-anchor, same as user dashboard).
 * Batch fetches all XP events to avoid N+1.
 */
export async function getActiveJobSeekerRanking(limit = 20): Promise<RankedUser[]> {
  const now = new Date();
  const since = daysAgo(STREAK_LOOKBACK_DAYS);

  // Fetch non-STAFF users with XP and jobs
  const users = await prisma.user.findMany({
    where: { hubStatus: { not: "STAFF" } },
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

  // Exclude hired users
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
        currentLevel: xp?.currentLevel ?? 1,
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
    where: { hubStatus: { not: "STAFF" } },
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
    // no_jobs first, then by days since active desc
    if (a.reason !== b.reason) return a.reason === "no_jobs" ? -1 : 1;
    return (b.daysSinceActive ?? 999) - (a.daysSinceActive ?? 999);
  });
}
