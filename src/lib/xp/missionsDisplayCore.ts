/**
 * Pure mission list derivation (safe for client import). No Prisma.
 */

import {
  effectiveLastDailyPeriodKey,
  getDailyPeriodKey,
  normalizePeriodKey,
} from "./dailyPeriod";

export const MISSIONS_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type MissionId =
  | "daily_check_in"
  | "daily_job_card"
  | "weekly_review"
  | "weekly_cycle";

export type MissionRowDTO = {
  id: MissionId;
  title: string;
  description: string;
  completed: boolean;
};

export type MissionsPayload = {
  daily: MissionRowDTO[];
  weekly: MissionRowDTO[];
  dailyRemaining: number;
  weeklyRemaining: number;
};

export type MissionsComputeInput = {
  now: Date;
  timeZone: string;
  lastDailyPeriodKey: string | null;
  lastDailyAt: Date | null;
  dailyTimeZoneFromRow: string | null;
  jobCreatedInCurrentPeriod: boolean;
  weeklyReviewDone: boolean;
  cycleCompletedThisWeek: boolean;
};

/** Pure derivation from loaded facts (unit-tested). */
export function computeMissionsPayload(
  input: MissionsComputeInput,
): MissionsPayload {
  const tz = input.timeZone;
  const currentKey = normalizePeriodKey(getDailyPeriodKey(input.now, tz));
  const lastKey = effectiveLastDailyPeriodKey({
    lastDailyPeriodKey: input.lastDailyPeriodKey,
    lastDailyAt: input.lastDailyAt,
    // Legacy DB may not have dailyTimeZone column. In that case, interpret
    // lastDailyAt with the currently resolved mission timezone (same surface).
    dailyTimeZone: input.dailyTimeZoneFromRow ?? tz,
  });
  const dailyCheckInDone =
    lastKey !== null && normalizePeriodKey(lastKey) === currentKey;

  const daily: MissionRowDTO[] = [
    {
      id: "daily_check_in",
      title: "Claim your daily XP",
      description: "Open the dashboard to unlock today's bonus.",
      completed: dailyCheckInDone,
    },
    {
      id: "daily_job_card",
      title: "Add a job card",
      description: "Log an application to earn XP.",
      completed: input.jobCreatedInCurrentPeriod,
    },
  ];

  const weekly: MissionRowDTO[] = [
    {
      id: "weekly_review",
      title: "Weekly review",
      description: "Reflect on your progress this week.",
      completed: input.weeklyReviewDone,
    },
    {
      id: "weekly_cycle",
      title: "Close a job cycle",
      description: "Mark a job as offer or rejected when it's decided.",
      completed: input.cycleCompletedThisWeek,
    },
  ];

  const dailyRemaining = daily.filter((m) => !m.completed).length;
  const weeklyRemaining = weekly.filter((m) => !m.completed).length;

  return { daily, weekly, dailyRemaining, weeklyRemaining };
}

/** Client fallback when the missions API fails — shows all rows as incomplete (no XP logic change). */
export function fallbackIncompleteMissionsPayload(timeZone: string): MissionsPayload {
  return computeMissionsPayload({
    now: new Date(),
    timeZone,
    lastDailyPeriodKey: null,
    lastDailyAt: null,
    dailyTimeZoneFromRow: null,
    jobCreatedInCurrentPeriod: false,
    weeklyReviewDone: false,
    cycleCompletedThisWeek: false,
  });
}
