// Shared types for the XP system.
// DB-generated enums are re-exported from here for use in pure logic layers.

export type XpReason =
  | "DAILY_ACTIVITY"
  | "JOB_CREATED"
  | "JOB_CREATED_COMPLETE"
  | "CYCLE_COMPLETED"
  | "CYCLE_INTERVIEW_BONUS"
  | "CYCLE_NOTE_BONUS"
  | "WEEKLY_REVIEW";

export interface XpGrant {
  reason: XpReason;
  amount: number;
}

export interface LevelInfo {
  level: number;
  /** XP earned within the current level (0-based). */
  currentLevelXp: number;
  /** XP required to complete this level (reach next level). */
  xpToNextLevel: number;
  /** Progress ratio 0–1 within the current level. */
  progress: number;
}

/** Minimal job shape required by XP reward functions (no DB types needed). */
export interface XpJobInput {
  company: string;
  title: string;
  status: string;
  appliedAt: Date | string;
  url?: string | null;
  jd?: string | null;
  cycleEndStage?: string | null;
}
