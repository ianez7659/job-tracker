/**
 * cardSelector.ts
 *
 * Selects the best active job card to use as context for the AI card-based
 * quiz question slot.
 *
 * Selection rules (from todo-quiz.md):
 *   1. Exclude archived (deletedAt != null) and terminal (offer/rejected) cards
 *   2. Prefer interview-stage cards (interview1/2/3) over other active cards
 *   3. Among candidates, prefer cards NOT used in quiz AI slots within 7 days
 *   4. Pick one at random from the final candidate list
 *   5. If no active card exists, return null → triggers fallback (exact category +1)
 */

import { TERMINAL_STATUSES } from "@/lib/jobPipeline";

const INTERVIEW_STAGES = ["interview1", "interview2", "interview3"] as const;

export interface JobCardCandidate {
  id: string;
  status: string;
  title: string;
  company: string;
  deletedAt: Date | null;
  jd?: string | null;
}

/** Deterministic random for testing: pass a seeded () => number */
export function selectActiveJobCard(
  jobs: JobCardCandidate[],
  recentlyUsedCardIds: Set<string> = new Set(),
  random: () => number = Math.random,
): JobCardCandidate | null {
  // 1. Exclude deleted and terminal cards
  const active = jobs.filter(
    (j) =>
      j.deletedAt == null &&
      !TERMINAL_STATUSES.includes(j.status as "offer" | "rejected"),
  );

  if (active.length === 0) return null;

  // 2. Prefer interview-stage cards
  const interviewCards = active.filter((j) =>
    INTERVIEW_STAGES.includes(j.status as (typeof INTERVIEW_STAGES)[number]),
  );
  const pool = interviewCards.length > 0 ? interviewCards : active;

  // 3. Prefer cards not used in last 7 days (soft preference — never block)
  const fresh = pool.filter((j) => !recentlyUsedCardIds.has(j.id));
  const candidates = fresh.length > 0 ? fresh : pool;

  // 4. Random pick
  const idx = Math.floor(random() * candidates.length);
  return candidates[idx];
}
