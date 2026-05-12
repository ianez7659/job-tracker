/**
 * questionSelector.ts
 *
 * 3-tier question selection for Daily Interview Quiz sessions.
 *
 * Tier structure:
 *   Tier 1 — common (category = "common")
 *   Tier 2 — group-common (e.g. category = "tech-common")
 *   Tier 3 — exact category (e.g. category = "web-development")
 *
 * Composition rules:
 *   With active job card:    common×2, group-common×1, exact×1, AI-slot×1 (total 5)
 *   Without active job card: common×2, group-common×1, exact×2            (total 5)
 *   AI slot unavailable:     falls back to without-card composition
 *
 * Difficulty preference (best-effort, never block session creation):
 *   With card:    common easy×1, common medium×1, group medium×1, exact med/hard×1, AI med/hard×1
 *   Without card: common easy×1, common medium×1, group medium×1, exact medium×1, exact hard×1
 *
 * Fallback cascade when a tier runs short:
 *   exact → group-common → common
 *   group-common → exact → common
 *
 * Recent-7-day deduplication: prefer questions not shown in last 7 days;
 * never fail session creation because of dedup constraints.
 */

import type { QuizQuestion } from "@/generated/prisma";
import { UserCategoryValue } from "@/lib/constants/categories";
import {
  isQuizSupportedCategory,
  getQuizSourceCategories,
  USER_CATEGORY_TO_QUIZ_MAP,
} from "./categoryMap";
import type { AiGeneratedQuestion } from "./aiQuestionSlot";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Difficulty = "easy" | "medium" | "hard";

export interface QuestionPool {
  common: QuizQuestion[];
  groupCommon: QuizQuestion[];
  exactCategory: QuizQuestion[];
}

export interface SelectedQuestions {
  questions: QuizQuestion[];
  aiSlot: AiGeneratedQuestion | null;
  /** True when AI slot was unavailable and exact-category fallback was used */
  usedAiFallback: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function preferByDifficulty(
  pool: QuizQuestion[],
  preferred: Difficulty[],
  count: number,
  recentIds: Set<string>,
  random: () => number,
): QuizQuestion[] {
  const fresh = pool.filter((q) => !recentIds.has(q.id));
  const candidates = fresh.length >= count ? fresh : pool;

  // Try preferred difficulties first, then relax
  const byDiff = (diff: Difficulty) =>
    candidates.filter((q) => q.difficulty === diff);

  const picked: QuizQuestion[] = [];
  const usedIds = new Set<string>();

  for (const diff of preferred) {
    for (const q of shuffleArray(byDiff(diff), random)) {
      if (picked.length >= count) break;
      if (!usedIds.has(q.id)) {
        picked.push(q);
        usedIds.add(q.id);
      }
    }
    if (picked.length >= count) break;
  }

  // Relax: accept any difficulty
  if (picked.length < count) {
    for (const q of shuffleArray(candidates, random)) {
      if (picked.length >= count) break;
      if (!usedIds.has(q.id)) {
        picked.push(q);
        usedIds.add(q.id);
      }
    }
  }

  return picked;
}

function shuffleArray<T>(arr: T[], random: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickN(
  pool: QuizQuestion[],
  count: number,
  recentIds: Set<string>,
  random: () => number,
  exclude: Set<string> = new Set(),
): QuizQuestion[] {
  const available = pool.filter((q) => !exclude.has(q.id));
  const fresh = available.filter((q) => !recentIds.has(q.id));
  const candidates = fresh.length >= count ? fresh : available;
  return shuffleArray(candidates, random).slice(0, count);
}

// ---------------------------------------------------------------------------
// Fallback cascade
// ---------------------------------------------------------------------------

/**
 * Tries to fill `needed` slots from tiers in priority order.
 * Falls back to lower/higher tiers when the primary pool runs short.
 */
function fillWithFallback(
  primaryPool: QuizQuestion[],
  fallbackPools: QuizQuestion[][],
  needed: number,
  recentIds: Set<string>,
  random: () => number,
  alreadyPicked: Set<string>,
): QuizQuestion[] {
  const result: QuizQuestion[] = [];

  const tryPick = (pool: QuizQuestion[], n: number) => {
    const picked = pickN(pool, n, recentIds, random, alreadyPicked);
    picked.forEach((q) => {
      result.push(q);
      alreadyPicked.add(q.id);
    });
  };

  tryPick(primaryPool, needed);

  let fallbackIdx = 0;
  while (result.length < needed && fallbackIdx < fallbackPools.length) {
    const remaining = needed - result.length;
    tryPick(fallbackPools[fallbackIdx], remaining);
    fallbackIdx++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main selector
// ---------------------------------------------------------------------------

export interface QuestionSelectorInput {
  userCategory: UserCategoryValue;
  pool: QuestionPool;
  aiQuestion: AiGeneratedQuestion | null;
  recentlyShownIds?: Set<string>;
  random?: () => number;
}

export interface QuestionSelectorError {
  error: "UNSUPPORTED_CATEGORY" | "INSUFFICIENT_QUESTIONS";
  message: string;
}

export type QuestionSelectorResult =
  | { ok: true; value: SelectedQuestions }
  | { ok: false; error: QuestionSelectorError };

export function selectQuizQuestions(
  input: QuestionSelectorInput,
): QuestionSelectorResult {
  const {
    userCategory,
    pool,
    aiQuestion,
    recentlyShownIds = new Set(),
    random = Math.random,
  } = input;

  // ESL / CELPIP guard
  if (!isQuizSupportedCategory(userCategory)) {
    return {
      ok: false,
      error: {
        error: "UNSUPPORTED_CATEGORY",
        message: `Category "${userCategory}" is not supported for Daily Interview Quiz. Language Programmes (ESL, CELPIP) are excluded from the current quiz pool.`,
      },
    };
  }

  const alreadyPicked = new Set<string>();
  const hasAi = aiQuestion !== null;

  // ── Slot counts ────────────────────────────────────────────────────────────
  // With AI:    common×2, group×1, exact×1, ai×1
  // Without AI: common×2, group×1, exact×2
  const exactNeeded = hasAi ? 1 : 2;

  // ── Common questions (Tier 1) ─────────────────────────────────────────────
  // Difficulties: easy×1, medium×1
  const commonPicked = preferByDifficulty(
    pool.common,
    ["easy", "medium", "hard"],
    2,
    recentlyShownIds,
    random,
  );
  commonPicked.forEach((q) => alreadyPicked.add(q.id));

  // ── Group-common questions (Tier 2) ───────────────────────────────────────
  const groupPicked = fillWithFallback(
    pool.groupCommon,
    [pool.exactCategory, pool.common],
    1,
    recentlyShownIds,
    random,
    alreadyPicked,
  );

  // ── Exact-category questions (Tier 3) ─────────────────────────────────────
  const exactDiffs: Difficulty[] = hasAi
    ? ["medium", "hard", "easy"]
    : ["medium", "hard", "easy"];

  const exactPicked = fillWithFallback(
    preferByDifficulty(
      pool.exactCategory.filter((q) => !alreadyPicked.has(q.id)),
      exactDiffs,
      exactNeeded,
      recentlyShownIds,
      random,
    ).length >= exactNeeded
      ? pool.exactCategory
      : pool.exactCategory,
    [pool.groupCommon, pool.common],
    exactNeeded,
    recentlyShownIds,
    random,
    alreadyPicked,
  );

  const selected = [...commonPicked, ...groupPicked, ...exactPicked];
  const aiSlot = hasAi ? aiQuestion : null;
  const usedAiFallback = !hasAi;

  if (selected.length < 5 - (hasAi ? 1 : 0)) {
    return {
      ok: false,
      error: {
        error: "INSUFFICIENT_QUESTIONS",
        message: `Could only select ${selected.length + (hasAi ? 1 : 0)} of 5 questions for category "${userCategory}". Question bank may be too small.`,
      },
    };
  }

  return {
    ok: true,
    value: {
      questions: selected,
      aiSlot,
      usedAiFallback,
    },
  };
}

// ---------------------------------------------------------------------------
// Pool builder (used by sessionService to load from DB)
// ---------------------------------------------------------------------------

/**
 * Partitions a flat list of QuizQuestion rows into the 3-tier pool structure.
 * Call this after fetching all candidate questions from the DB.
 */
export function buildQuestionPool(
  questions: QuizQuestion[],
  userCategory: UserCategoryValue,
): QuestionPool {
  const sources = getQuizSourceCategories(userCategory);
  // sources = ["common", "<group>-common", "<quiz-category>"]
  const [commonCat, groupCat, exactCat] = sources;

  return {
    common: questions.filter((q) => q.category === commonCat),
    groupCommon: questions.filter((q) => q.category === groupCat),
    exactCategory: questions.filter((q) => q.category === exactCat),
  };
}

/**
 * Returns the DB category filter values for a given user category.
 * Used to build the Prisma WHERE clause.
 */
export function getDbCategoryFilter(userCategory: UserCategoryValue): string[] {
  return getQuizSourceCategories(userCategory);
}

/**
 * Returns the categoryGroup string for a user category (lowercase parentId).
 * e.g. "web_development" → "tech"
 */
export function getCategoryGroupForUser(
  userCategory: UserCategoryValue,
): string | null {
  const entry = USER_CATEGORY_TO_QUIZ_MAP.find(
    (m) => m.userCategoryValue === userCategory,
  );
  return entry?.categoryGroup ?? null;
}
