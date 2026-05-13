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
  | "daily_interview_drill"
  | "weekly_review"
  | "weekly_cycle";

// ---------------------------------------------------------------------------
// MissionRowDTO — extended with optional fields for richer UI
// ---------------------------------------------------------------------------

/** 3-state status for missions that have more than a simple done/not-done state. */
export type MissionStatus = "not_started" | "in_progress" | "completed";

/**
 * One row in the missions list.
 *
 * All fields beyond `completed` are optional to maintain backward compatibility
 * with existing missions that only use the `completed` boolean.
 *
 * New missions (e.g. Daily Interview Drill) can use:
 *   - `status` for 3-state display
 *   - `ctaLabel` for custom button text
 *   - `href` for navigation (link instead of callback)
 *   - `progressLabel` for "2/5" or "Completed" text
 *   - `rewardLabel` for "+10 XP" or "+10 XP earned"
 */
export type MissionRowDTO = {
  id: MissionId;
  title: string;
  description: string;
  completed: boolean;
  status?: MissionStatus;
  ctaLabel?: string;
  href?: string;
  progressLabel?: string;
  rewardLabel?: string;
};

export type MissionsPayload = {
  daily: MissionRowDTO[];
  weekly: MissionRowDTO[];
  dailyRemaining: number;
  weeklyRemaining: number;
};

// ---------------------------------------------------------------------------
// MissionsComputeInput — extended with optional quiz fields
// ---------------------------------------------------------------------------

export type MissionsComputeInput = {
  now: Date;
  timeZone: string;
  lastDailyPeriodKey: string | null;
  lastDailyAt: Date | null;
  dailyTimeZoneFromRow: string | null;
  jobCreatedInCurrentPeriod: boolean;
  weeklyReviewDone: boolean;
  cycleCompletedThisWeek: boolean;
  // Quiz — optional to keep existing callers/tests backward compatible.
  // When omitted, quiz row shows as not_started with 0/5 progress.
  quizStatus?: MissionStatus | null;
  quizCompletedQuestions?: number;
  quizTotalQuestions?: number;
};

// ---------------------------------------------------------------------------
// computeMissionsPayload
// ---------------------------------------------------------------------------

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

  // Quiz row
  const quizStatus: MissionStatus = input.quizStatus ?? "not_started";
  const quizCompleted = input.quizCompletedQuestions ?? 0;
  const quizTotal = input.quizTotalQuestions ?? 5;
  const quizDone = quizStatus === "completed";

  const quizCtaLabel =
    quizStatus === "completed" ? "Review" :
    quizStatus === "in_progress" ? "Continue" :
    "Start";

  const quizProgressLabel =
    quizStatus === "completed"
      ? "Completed"
      : `${quizCompleted}/${quizTotal}`;

  const quizRewardLabel =
    quizStatus === "completed" ? "+10 XP earned" : "+10 XP";

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
    {
      id: "daily_interview_drill",
      title: "Daily Interview Drill",
      description: "Complete today's 5-question interview drill.",
      completed: quizDone,
      status: quizStatus,
      ctaLabel: quizCtaLabel,
      href: "/dashboard/interview-drill",
      progressLabel: quizProgressLabel,
      rewardLabel: quizRewardLabel,
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
