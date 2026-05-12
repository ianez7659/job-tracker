/**
 * aiQuestionSlot.ts
 *
 * Step 2 STUB — always returns null.
 *
 * In Step 3 this will be replaced with actual OpenAI API call logic.
 * The session engine treats a null return as "AI unavailable" and activates
 * the fallback: use one extra exact-category question instead.
 *
 * The interface is defined here so Step 3 can implement it without touching
 * the session engine or questionSelector.
 */

import type { QuizChoiceRaw } from "./choiceShuffler";

export interface AiGeneratedQuestion {
  /** Unique ID for this AI question (not in QuizQuestion table) */
  sourceId: string;
  sourceType: "ai_card_based";
  questionType: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  choices: QuizChoiceRaw[];
  correctChoiceId: string;
  correctExplanation: string;
  wrongExplanations: Record<string, string>;
  tags: string[];
  /** The job card ID that was used as context */
  jobCardId: string;
}

export interface AiQuestionSlotInput {
  userId: string;
  jobCardId: string;
  jobTitle: string;
  jobCompany: string;
  jobStage: string;
  userCategory: string;
  jd?: string | null;
}

/**
 * Attempts to generate an AI card-based question.
 *
 * Step 2: Always returns null (stub).
 * Step 3: Will call OpenAI and return AiGeneratedQuestion on success.
 */
export async function generateAiQuizQuestion(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _input: AiQuestionSlotInput,
): Promise<AiGeneratedQuestion | null> {
  // TODO (Step 3): implement OpenAI prompt + response validation
  return null;
}
