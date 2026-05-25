/**
 * Admin domain threshold constants — single source of truth.
 * Change a value here to affect all admin queries and logic uniformly.
 */

/** Days of DAILY_ACTIVITY events that count as "recently active" */
export const ACTIVE_WINDOW_DAYS = 3;

/** Days without DAILY_ACTIVITY before a user is considered inactive */
export const INACTIVE_THRESHOLD_DAYS = 14;

/** Days in applying/resume status before a job is considered stuck */
export const STUCK_THRESHOLD_DAYS = 14;

/** XP event history window for login-streak computation */
export const STREAK_LOOKBACK_DAYS = 140;

/** Number of preview rows shown per card on the overview page */
export const PREVIEW_LIMIT = 3;

/** Job status that indicates an accepted offer / hire */
export const OFFER_STATUS = "offer";

/** Job statuses that have no forward movement (stuck) */
export const STUCK_STATUSES = ["applying", "resume"] as const;

/** Job statuses that represent an active interview stage */
export const INTERVIEW_STATUSES = ["interview1", "interview2", "interview3"] as const;
