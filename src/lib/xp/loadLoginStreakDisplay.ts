import { prisma } from "@/lib/prisma";
import {
  getDailyPeriodKey,
  isValidIanaTimeZone,
  normalizePeriodKey,
} from "@/lib/xp/dailyPeriod";
import { computeLoginStreakDisplay } from "@/lib/xp/streakDisplayCore";

function resolveTimeZone(
  clientTimeZone: string | undefined,
  rowTz: string | null | undefined,
): string {
  if (clientTimeZone && isValidIanaTimeZone(clientTimeZone)) {
    return clientTimeZone;
  }
  if (rowTz && isValidIanaTimeZone(rowTz)) return rowTz;
  return "UTC";
}

/**
 * Login streak + Mon–Sun strip derived from DAILY_ACTIVITY events (no new DB columns).
 */
export async function loadLoginStreakDisplayForUser(
  userId: string,
  clientTimeZone?: string | null,
): Promise<ReturnType<typeof computeLoginStreakDisplay>> {
  const now = new Date();
  const since = new Date(now.getTime() - 140 * 24 * 60 * 60 * 1000);

  let rowTz: string | null | undefined;
  let userXpId: string | null = null;

  try {
    const row = await prisma.userXp.findUnique({
      where: { userId },
      select: { id: true, dailyTimeZone: true },
    });
    userXpId = row?.id ?? null;
    rowTz = row?.dailyTimeZone ?? null;
  } catch (err) {
    if ((err as { code?: string })?.code !== "P2022") throw err;
    const legacy = await prisma.userXp.findUnique({
      where: { userId },
      select: { id: true },
    });
    userXpId = legacy?.id ?? null;
    rowTz = null;
  }

  const tz = resolveTimeZone(clientTimeZone ?? undefined, rowTz ?? null);

  if (!userXpId) {
    return computeLoginStreakDisplay(now, tz, new Set());
  }

  const events = await prisma.xpEvent.findMany({
    where: {
      userXpId,
      reason: "DAILY_ACTIVITY",
      createdAt: { gte: since },
    },
    select: { createdAt: true },
  });

  const claimed = new Set<string>();
  for (const e of events) {
    claimed.add(normalizePeriodKey(getDailyPeriodKey(e.createdAt, tz)));
  }

  return computeLoginStreakDisplay(now, tz, claimed);
}
