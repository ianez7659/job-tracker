/**
 * quizHelpers.ts
 *
 * Pure helper functions for the quiz client — no DB, no fetch, no side effects.
 * All functions are deterministic and unit-testable.
 */

import type { QuizItem, AnsweredItem, WrongExplanation } from "./quizClientTypes";

/**
 * Returns the index of the first unanswered item, or -1 if all are answered.
 */
export function findFirstUnansweredIndex(items: QuizItem[]): number {
  return items.findIndex((item) => !item.answered);
}

/**
 * Returns the count of correctly answered items.
 */
export function computeCorrectCount(items: QuizItem[]): number {
  return items.filter((item): item is AnsweredItem => item.answered && item.isCorrect === true)
    .length;
}

/**
 * Returns the completion percentage (0–100), rounded.
 */
export function computePercentComplete(completedQuestions: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  return Math.round((completedQuestions / totalQuestions) * 100);
}

/**
 * Returns the wrong explanation for a given choice id, or undefined if not found.
 */
export function findWrongExplanation(
  wrongExplanations: WrongExplanation[],
  choiceId: string,
): string | undefined {
  return wrongExplanations.find((w) => w.choiceId === choiceId)?.explanation;
}

/**
 * Returns true if the session is fully completed (all items answered).
 */
export function isSessionComplete(status: string): boolean {
  return status === "completed";
}
