// DB-aware XP service.
// Wraps pure reward functions with prisma persistence and idempotency guards.
// All public functions are fire-and-forget safe: errors are caught internally
// and never propagate to callers (so job operations always succeed).

import { prisma } from "@/lib/prisma";
import type { XpGrant, XpJobInput } from "./types";
import {
  grantsForJobCreation,
  grantsForCycleCompletion,
  grantDailyActivity,
  grantWeeklyReview,
} from "./rewards";
import {
  effectiveLastDailyPeriodKey,
  getDailyPeriodKey,
  isDailyRewardEligibleForPeriod,
  isValidIanaTimeZone,
  normalizePeriodKey,
} from "./dailyPeriod";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// ── Internal helpers ──────────────────────────────────────────────────────────

async function ensureUserXp(userId: string) {
  return prisma.userXp.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

async function applyGrants(
  userXpId: string,
  grants: XpGrant[],
  jobId?: string,
): Promise<void> {
  if (grants.length === 0) return;
  const totalAmount = grants.reduce((sum, g) => sum + g.amount, 0);
  await prisma.$transaction([
    ...grants.map((g) =>
      prisma.xpEvent.create({
        data: {
          userXpId,
          reason: g.reason,
          amount: g.amount,
          jobId: jobId ?? null,
        },
      }),
    ),
    prisma.userXp.update({
      where: { id: userXpId },
      data: { totalXp: { increment: totalAmount } },
    }),
  ]);
}

/**
 * One daily award per (IANA timeZone) “day” starting at 05:00 local (see getDailyPeriodKey).
 * When `dailyTimeZone` is null (user never sent TZ from dashboard), uses UTC for side-effect paths.
 */
async function tryApplyDailyGrantForUser(
  userId: string,
  timeZone: string,
): Promise<void> {
  const row = await prisma.userXp.findUnique({ where: { userId } });
  if (!row) return;

  const now = new Date();
  const currentKey = normalizePeriodKey(getDailyPeriodKey(now, timeZone));
  const lastKey = effectiveLastDailyPeriodKey(row);
  if (!isDailyRewardEligibleForPeriod(lastKey, currentKey)) return;

  const grant = grantDailyActivity();
  await prisma.$transaction([
    prisma.xpEvent.create({
      data: { userXpId: row.id, reason: grant.reason, amount: grant.amount },
    }),
    prisma.userXp.update({
      where: { id: row.id },
      data: {
        totalXp: { increment: grant.amount },
        lastDailyAt: now,
        lastDailyPeriodKey: currentKey,
        dailyTimeZone: timeZone,
      },
    }),
  ]);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Award XP for job card creation.
 * Idempotent: skips if JOB_CREATED already logged for this jobId.
 * Also checks daily activity reward.
 */
export async function awardForJobCreation(
  userId: string,
  job: XpJobInput & { id: string },
): Promise<void> {
  try {
    const userXp = await ensureUserXp(userId);
    const alreadyAwarded = await prisma.xpEvent.findFirst({
      where: { userXpId: userXp.id, reason: "JOB_CREATED", jobId: job.id },
    });
    if (alreadyAwarded) return;

    const grants = grantsForJobCreation(job);
    await applyGrants(userXp.id, grants, job.id);

    const tz = userXp.dailyTimeZone ?? "UTC";
    await tryApplyDailyGrantForUser(userId, tz);
  } catch (err) {
    console.error("[XP] awardForJobCreation failed:", err);
  }
}

/**
 * Award XP when a job cycle closes (status = offer | rejected).
 * Idempotent: skips if CYCLE_COMPLETED already logged for this jobId.
 * Also checks daily activity reward.
 */
export async function awardForCycleCompletion(
  userId: string,
  job: XpJobInput & { id: string },
): Promise<void> {
  try {
    const userXp = await ensureUserXp(userId);
    const alreadyAwarded = await prisma.xpEvent.findFirst({
      where: { userXpId: userXp.id, reason: "CYCLE_COMPLETED", jobId: job.id },
    });
    if (alreadyAwarded) return;

    const grants = grantsForCycleCompletion(job);
    await applyGrants(userXp.id, grants, job.id);
    const tz = userXp.dailyTimeZone ?? "UTC";
    await tryApplyDailyGrantForUser(userId, tz);
  } catch (err) {
    console.error("[XP] awardForCycleCompletion failed:", err);
  }
}

/**
 * Award daily activity XP (dashboard open + optional body timeZone).
 * When `timeZone` is a valid IANA id, it is stored on UserXp for future side-effect awards.
 */
export async function awardDailyActivity(
  userId: string,
  options?: { timeZone?: string },
): Promise<void> {
  try {
    const userXp = await ensureUserXp(userId);
    const fromClient =
      options?.timeZone && isValidIanaTimeZone(options.timeZone)
        ? options.timeZone
        : null;
    const tz = fromClient ?? userXp.dailyTimeZone ?? "UTC";

    if (fromClient && userXp.dailyTimeZone !== fromClient) {
      await prisma.userXp.update({
        where: { id: userXp.id },
        data: { dailyTimeZone: fromClient },
      });
    }

    await tryApplyDailyGrantForUser(userId, tz);
  } catch (err) {
    console.error("[XP] awardDailyActivity failed:", err);
  }
}

/**
 * Award weekly review XP.
 * Idempotent: skips if WEEKLY_REVIEW already logged within the last 7 days.
 * Returns { awarded: true } if XP was granted, { awarded: false } if already earned.
 *
 * NOTE: There is no dedicated weekly review UI flow in the current codebase.
 * The /api/xp/weekly-review route calls this function.
 */
export async function awardWeeklyReview(
  userId: string,
): Promise<{ awarded: boolean }> {
  try {
    const userXp = await ensureUserXp(userId);
    const oneWeekAgo = new Date(Date.now() - WEEK_MS);
    const recent = await prisma.xpEvent.findFirst({
      where: {
        userXpId: userXp.id,
        reason: "WEEKLY_REVIEW",
        createdAt: { gte: oneWeekAgo },
      },
    });
    if (recent) return { awarded: false };

    const grant = grantWeeklyReview();
    await applyGrants(userXp.id, [grant]);
    const tz = userXp.dailyTimeZone ?? "UTC";
    await tryApplyDailyGrantForUser(userId, tz);
    return { awarded: true };
  } catch (err) {
    console.error("[XP] awardWeeklyReview failed:", err);
    return { awarded: false };
  }
}
