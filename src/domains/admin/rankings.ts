import { prisma } from "@/lib/prisma";
import {
  getDailyPeriodKey,
  normalizePeriodKey,
} from "@/lib/xp/dailyPeriod";
import { computeLoginStreak } from "@/lib/xp/streakDisplayCore";
import type { AdminRankings, RankedUser } from "./types";

const OFFER_STATUS = "offer";
const STREAK_LOOKBACK_DAYS = 140;
const RANKING_LIMIT = 20;

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Rankings for /admin/rankings.
 * Hired users (any offer job) are excluded from all rankings.
 * Returns top XP and top streak lists.
 */
export async function getAdminRankings(): Promise<AdminRankings> {
  const now = new Date();
  const since = daysAgo(STREAK_LOOKBACK_DAYS);

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

  // Exclude hired users
  const nonHired = users.filter(
    (u) => !u.jobs.some((j) => j.status === OFFER_STATUS)
  );

  const ranked: RankedUser[] = nonHired.map((u) => {
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

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      category: u.category,
      totalXp: xp?.totalXp ?? 0,
      currentLevel: xp?.currentLevel ?? 1,
      lastActiveAt,
      loginStreak,
    };
  });

  const topXp = [...ranked]
    .sort((a, b) => b.totalXp - a.totalXp)
    .slice(0, RANKING_LIMIT);

  const topStreak = [...ranked]
    .sort((a, b) => b.loginStreak - a.loginStreak || b.totalXp - a.totalXp)
    .slice(0, RANKING_LIMIT);

  return { topXp, topStreak };
}
