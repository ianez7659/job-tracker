/**
 * Mapping between quiz JSON category values (hyphen format, e.g. "web-development")
 * and USER_CATEGORIES values (underscore format, e.g. "web_development").
 *
 * Quiz JSON files use hyphen-separated category names that correspond 1-to-1
 * with USER_CATEGORIES values after replacing hyphens with underscores.
 *
 * Group-level quiz files (common, tech-common, etc.) are NOT directly mapped
 * to a USER_CATEGORIES value — they act as shared question pools.
 */

import {
  USER_CATEGORIES,
  UserCategoryValue,
  getParentIdForCategory,
} from "../constants/categories";

// ---------------------------------------------------------------------------
// Unsupported categories
// ---------------------------------------------------------------------------

/**
 * These USER_CATEGORIES values have no corresponding quiz content.
 * Language Programmes (ESL, CELPIP) are excluded because they are language
 * test programmes, not job interview preparation categories.
 */
export const QUIZ_UNSUPPORTED_CATEGORIES: readonly UserCategoryValue[] = [
  "esl",
  "celpip",
] as const;

export function isQuizSupportedCategory(value: UserCategoryValue): boolean {
  return !(QUIZ_UNSUPPORTED_CATEGORIES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Format conversion
// ---------------------------------------------------------------------------

/**
 * Convert a quiz JSON category string (hyphen) to the USER_CATEGORIES value
 * (underscore). Returns null if no matching USER_CATEGORIES entry exists.
 *
 * Example: "web-development" → "web_development"
 */
export function quizCategoryToUserCategory(
  quizCategory: string,
): UserCategoryValue | null {
  const candidate = quizCategory.replace(/-/g, "_");
  const found = USER_CATEGORIES.find((c) => c.value === candidate);
  return found ? found.value : null;
}

/**
 * Convert a USER_CATEGORIES value (underscore) to the quiz JSON category
 * string (hyphen).
 *
 * Example: "web_development" → "web-development"
 */
export function userCategoryToQuizCategory(userCategory: string): string {
  return userCategory.replace(/_/g, "-");
}

// ---------------------------------------------------------------------------
// Quiz source pool derivation
// ---------------------------------------------------------------------------

/**
 * Quiz JSON category strings that represent group-level shared question pools.
 * These are not tied to a single USER_CATEGORIES value.
 */
export const GROUP_LEVEL_QUIZ_CATEGORIES = [
  "common",
  "tech-common",
  "management-common",
  "marketing-common",
] as const;

export type GroupLevelQuizCategory = (typeof GROUP_LEVEL_QUIZ_CATEGORIES)[number];

/**
 * Given a USER_CATEGORIES value, return the ordered list of quiz JSON
 * category strings whose questions should be pooled for session creation.
 *
 * Order (from broadest to most specific):
 *   1. "common"            — shared across all categories
 *   2. "<parentId>-common" — shared within the category group (tech/management/marketing)
 *   3. "<quiz-category>"   — category-specific questions
 *
 * Returns an empty array for unsupported categories.
 */
export function getQuizSourceCategories(
  userCategory: UserCategoryValue,
): string[] {
  if (!isQuizSupportedCategory(userCategory)) return [];

  const parentId = getParentIdForCategory(userCategory);
  const quizCategory = userCategoryToQuizCategory(userCategory);

  const sources: string[] = ["common"];
  if (parentId) {
    sources.push(`${parentId}-common`);
  }
  sources.push(quizCategory);

  return sources;
}

// ---------------------------------------------------------------------------
// Full mapping table (for documentation / import use)
// ---------------------------------------------------------------------------

/**
 * Complete mapping from USER_CATEGORIES value to quiz JSON category and
 * categoryGroup. Used by the import script and session creation logic.
 */
export const USER_CATEGORY_TO_QUIZ_MAP = USER_CATEGORIES.filter(
  (c) => isQuizSupportedCategory(c.value),
).map((c) => ({
  userCategoryValue: c.value,
  quizCategory: userCategoryToQuizCategory(c.value),
  categoryGroup: c.parentId,
  parentLabel: c.parentId.charAt(0).toUpperCase() + c.parentId.slice(1),
}));
