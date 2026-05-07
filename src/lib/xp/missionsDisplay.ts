/**
 * Server-side read-only mission payload. Client components must import types from
 * `missionsDisplayCore` only — this module pulls in Prisma.
 */

import { prisma } from "@/lib/prisma";
import {
  getDailyPeriodKey,
  isValidIanaTimeZone,
  normalizePeriodKey,
} from "./dailyPeriod";
import {
  computeMissionsPayload,
  MISSIONS_WEEK_MS,
  type MissionsPayload,
} from "./missionsDisplayCore";

export {
  computeMissionsPayload,
  MISSIONS_WEEK_MS,
  type MissionId,
  type MissionRowDTO,
  type MissionsPayload,
  type MissionsComputeInput,
} from "./missionsDisplayCore";

function resolveTimeZone(
  clientTimeZone: string | undefined,
  rowTz: string | null,
): string {
  if (clientTimeZone && isValidIanaTimeZone(clientTimeZone)) {
    return clientTimeZone;
  }
  if (rowTz && isValidIanaTimeZone(rowTz)) return rowTz;
  return "UTC";
}

/**
 * Loads mission completion flags from DB (read-only).
 */
export async function loadMissionsPayloadForUser(
  userId: string,
  clientTimeZone?: string,
): Promise<MissionsPayload> {
  const now = new Date();
  let userXp: {
    id: string;
    lastDailyPeriodKey: string | null;
    lastDailyAt: Date | null;
    dailyTimeZone: string | null;
  } | null = null;

  try {
    userXp = await prisma.userXp.findUnique({
      where: { userId },
      select: {
        id: true,
        lastDailyPeriodKey: true,
        lastDailyAt: true,
        dailyTimeZone: true,
      },
    });
  } catch (err) {
    // Backward compatibility: older DBs may not have lastDailyPeriodKey yet (P2022).
    if ((err as { code?: string })?.code !== "P2022") throw err;
    const legacy = await prisma.userXp.findUnique({
      where: { userId },
      select: {
        id: true,
        lastDailyAt: true,
      },
    });
    userXp = legacy
      ? {
          id: legacy.id,
          lastDailyPeriodKey: null,
          lastDailyAt: legacy.lastDailyAt,
          dailyTimeZone: null,
        }
      : null;
  }

  const tz = resolveTimeZone(clientTimeZone, userXp?.dailyTimeZone ?? null);
  const currentKey = normalizePeriodKey(getDailyPeriodKey(now, tz));
  const weekAgo = new Date(now.getTime() - MISSIONS_WEEK_MS);

  if (!userXp) {
    return computeMissionsPayload({
      now,
      timeZone: tz,
      lastDailyPeriodKey: null,
      lastDailyAt: null,
      dailyTimeZoneFromRow: null,
      jobCreatedInCurrentPeriod: false,
      weeklyReviewDone: false,
      cycleCompletedThisWeek: false,
    });
  }

  // Keep this query enum-safe for older DB states: avoid filtering by enum literals
  // in SQL WHERE, then classify reasons in memory.
  const events = await prisma.xpEvent.findMany({
    where: {
      userXpId: userXp.id,
      createdAt: { gte: weekAgo },
    },
    select: { reason: true, createdAt: true },
  });

  let jobCreatedInCurrentPeriod = false;
  let weeklyReviewDone = false;
  let cycleCompletedThisWeek = false;

  for (const e of events) {
    if (e.reason === "JOB_CREATED") {
      const k = normalizePeriodKey(getDailyPeriodKey(e.createdAt, tz));
      if (k === currentKey) jobCreatedInCurrentPeriod = true;
    }
    if (e.reason === "WEEKLY_REVIEW" && e.createdAt >= weekAgo) {
      weeklyReviewDone = true;
    }
    if (e.reason === "CYCLE_COMPLETED" && e.createdAt >= weekAgo) {
      cycleCompletedThisWeek = true;
    }
  }

  return computeMissionsPayload({
    now,
    timeZone: tz,
    lastDailyPeriodKey: userXp.lastDailyPeriodKey,
    lastDailyAt: userXp.lastDailyAt,
    dailyTimeZoneFromRow: userXp.dailyTimeZone,
    jobCreatedInCurrentPeriod,
    weeklyReviewDone,
    cycleCompletedThisWeek,
  });
}
