/**
 * sessionSerializer.ts
 *
 * Strips sensitive answer fields from quiz session items before sending to the client.
 *
 * Principle (Option B):
 *   - Unanswered items: omit correctChoiceIdSnapshot, correctIndexSnapshot,
 *     correctExplanationSnapshot, wrongExplanationsSnapshot
 *   - Answered items: include all fields (needed for review UI)
 *
 * DB schema is never modified. This is a pure response serializer.
 */

import type { DailyQuizSession, DailyQuizSessionItem } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Public serialized types (what the client receives)
// ---------------------------------------------------------------------------

/** Fields always present on every item. */
type QuizItemBase = {
  id: string;
  sessionId: string;
  questionId: string | null;
  sourceType: string;
  orderIndex: number;
  renderedQuestionSnapshot: string;
  choicesSnapshot: unknown;
  /** Null until answered. */
  userAnswerChoiceId: string | null;
  userAnswerIndex: number | null;
  isCorrect: boolean | null;
  answeredAt: Date | null;
  metadata: unknown;
};

/** Unanswered item — answer fields omitted. */
export type UnansweredQuizItem = QuizItemBase & {
  answered: false;
};

/** Answered item — full answer + explanation fields included. */
export type AnsweredQuizItem = QuizItemBase & {
  answered: true;
  correctChoiceIdSnapshot: string;
  correctIndexSnapshot: number;
  correctExplanationSnapshot: string;
  wrongExplanationsSnapshot: unknown;
};

export type SerializedQuizItem = UnansweredQuizItem | AnsweredQuizItem;

export type SerializedQuizSession = {
  session: DailyQuizSession;
  items: SerializedQuizItem[];
};

// ---------------------------------------------------------------------------
// Serializer
// ---------------------------------------------------------------------------

/**
 * Serializes a quiz session for the client response.
 * Strips correctChoiceIdSnapshot / correctIndexSnapshot /
 * correctExplanationSnapshot / wrongExplanationsSnapshot from unanswered items.
 */
export function serializeSessionForClient(
  session: DailyQuizSession,
  items: DailyQuizSessionItem[],
): SerializedQuizSession {
  const serializedItems: SerializedQuizItem[] = items.map((item) => {
    const base: QuizItemBase = {
      id: item.id,
      sessionId: item.sessionId,
      questionId: item.questionId,
      sourceType: item.sourceType,
      orderIndex: item.orderIndex,
      renderedQuestionSnapshot: item.renderedQuestionSnapshot,
      choicesSnapshot: item.choicesSnapshot,
      userAnswerChoiceId: item.userAnswerChoiceId,
      userAnswerIndex: item.userAnswerIndex,
      isCorrect: item.isCorrect,
      answeredAt: item.answeredAt,
      metadata: item.metadata,
    };

    const isAnswered = item.isCorrect !== null;

    if (isAnswered) {
      return {
        ...base,
        answered: true,
        correctChoiceIdSnapshot: item.correctChoiceIdSnapshot,
        correctIndexSnapshot: item.correctIndexSnapshot,
        correctExplanationSnapshot: item.correctExplanationSnapshot,
        wrongExplanationsSnapshot: item.wrongExplanationsSnapshot,
      } satisfies AnsweredQuizItem;
    }

    return {
      ...base,
      answered: false,
    } satisfies UnansweredQuizItem;
  });

  return { session, items: serializedItems };
}
