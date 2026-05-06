// Pure XP reward calculation — no DB dependency.
// All functions are deterministic given their inputs.

import type { XpGrant, XpJobInput } from "./types";

// ── Constants ────────────────────────────────────────────────────────────────

export const XP_DAILY_ACTIVITY = 8;
export const XP_JOB_CREATED = 10;
export const XP_JOB_CREATED_COMPLETE_BONUS = 5;
export const XP_CYCLE_COMPLETED = 30;
export const XP_CYCLE_INTERVIEW_BONUS = 10;
export const XP_CYCLE_NOTE_BONUS = 5;
export const XP_WEEKLY_REVIEW = 20;

/** Pipeline stages that count as "passed at least one interview". */
const INTERVIEW_STAGES = new Set(["interview1", "interview2", "interview3"]);
const TERMINAL_STATUSES = new Set(["offer", "rejected"]);

// ── Card completeness ────────────────────────────────────────────────────────

/**
 * A card is considered "complete" when all five core fields are filled:
 * company, title, status, appliedAt, url.
 */
export function isJobCardComplete(job: XpJobInput): boolean {
  return (
    !!job.company?.trim() &&
    !!job.title?.trim() &&
    !!job.status?.trim() &&
    !!job.appliedAt &&
    !!job.url?.trim()
  );
}

// Daily XP period logic (local anchor hour + IANA TZ): see `dailyPeriod.ts`.

// ── Job creation rewards ─────────────────────────────────────────────────────

/**
 * Returns the XP grants for creating a new job card.
 * Always includes JOB_CREATED; adds JOB_CREATED_COMPLETE if card is complete.
 */
export function grantsForJobCreation(job: XpJobInput): XpGrant[] {
  const grants: XpGrant[] = [
    { reason: "JOB_CREATED", amount: XP_JOB_CREATED },
  ];
  if (isJobCardComplete(job)) {
    grants.push({
      reason: "JOB_CREATED_COMPLETE",
      amount: XP_JOB_CREATED_COMPLETE_BONUS,
    });
  }
  return grants;
}

// ── Cycle completion rewards ─────────────────────────────────────────────────

/**
 * Returns the XP grants when a job cycle closes (status = offer | rejected).
 * - Always: +30 CYCLE_COMPLETED
 * - If cycleEndStage is an interview stage: +10 CYCLE_INTERVIEW_BONUS
 * - If job has a final note (jd field non-empty): +5 CYCLE_NOTE_BONUS
 */
export function grantsForCycleCompletion(job: XpJobInput): XpGrant[] {
  if (!TERMINAL_STATUSES.has(job.status)) return [];

  const grants: XpGrant[] = [
    { reason: "CYCLE_COMPLETED", amount: XP_CYCLE_COMPLETED },
  ];

  if (job.cycleEndStage && INTERVIEW_STAGES.has(job.cycleEndStage)) {
    grants.push({
      reason: "CYCLE_INTERVIEW_BONUS",
      amount: XP_CYCLE_INTERVIEW_BONUS,
    });
  }

  if (job.jd?.trim()) {
    grants.push({
      reason: "CYCLE_NOTE_BONUS",
      amount: XP_CYCLE_NOTE_BONUS,
    });
  }

  return grants;
}

// ── Daily / weekly one-shot grants ───────────────────────────────────────────

export function grantDailyActivity(): XpGrant {
  return { reason: "DAILY_ACTIVITY", amount: XP_DAILY_ACTIVITY };
}

export function grantWeeklyReview(): XpGrant {
  return { reason: "WEEKLY_REVIEW", amount: XP_WEEKLY_REVIEW };
}
