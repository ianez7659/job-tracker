/**
 * practiceService.ts
 *
 * Stateless practice question selection — no DB session created.
 * Returns 5 random questions with full answer data for client-side checking.
 */

import { prisma } from "@/lib/prisma";
import { getDbCategoryFilter } from "./questionSelector";
import { buildShuffledSnapshot } from "./choiceShuffler";
import type { UserCategoryValue } from "@/lib/constants/categories";
import type { QuizChoiceRaw } from "./choiceShuffler";
import type { PracticeItem } from "./quizClientTypes";

const PRACTICE_COUNT = 5;

export async function getPracticeQuestions(userId: string): Promise<PracticeItem[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { category: true },
  });

  if (!user?.category) return [];

  const categoryFilter = getDbCategoryFilter(user.category as UserCategoryValue);

  const questions = await prisma.quizQuestion.findMany({
    where: { category: { in: categoryFilter }, isActive: true },
    select: {
      question: true,
      choices: true,
      correctChoiceId: true,
      correctExplanation: true,
      wrongExplanations: true,
    },
  });

  if (questions.length === 0) return [];

  // Fisher-Yates shuffle, take up to PRACTICE_COUNT
  const pool = [...questions];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const selected = pool.slice(0, Math.min(PRACTICE_COUNT, pool.length));

  return selected.map((q) => {
    const rawChoices = q.choices as unknown as QuizChoiceRaw[];
    const snapshot = buildShuffledSnapshot(rawChoices, q.correctChoiceId);
    return {
      question: q.question,
      choices: snapshot.choicesSnapshot,
      correctChoiceId: snapshot.correctChoiceIdSnapshot,
      correctIndex: snapshot.correctIndexSnapshot,
      correctExplanation: q.correctExplanation,
      wrongExplanations: q.wrongExplanations as { choiceId: string; explanation: string }[],
    };
  });
}
