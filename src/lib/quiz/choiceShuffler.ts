/**
 * choiceShuffler.ts
 *
 * Shuffles a question's choices using Fisher-Yates and computes the
 * correctIndexSnapshot (0-based index in the shuffled array).
 *
 * The shuffled order is persisted in DailyQuizSessionItem.choicesSnapshot so
 * the same order is shown on every page load for the same session.
 */

export interface QuizChoiceRaw {
  id: string;
  text: string;
}

export interface ShuffledSnapshot {
  choicesSnapshot: QuizChoiceRaw[];
  correctChoiceIdSnapshot: string;
  correctIndexSnapshot: number;
}

/**
 * Fisher-Yates in-place shuffle (mutates the array).
 * Accepts an optional seeded random function for testing.
 */
export function fisherYatesShuffle<T>(
  arr: T[],
  random: () => number = Math.random,
): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Takes the original choices array and correctChoiceId, returns the snapshot
 * fields needed for DailyQuizSessionItem.
 *
 * Throws if correctChoiceId is not found in choices (data integrity guard).
 */
export function buildShuffledSnapshot(
  choices: QuizChoiceRaw[],
  correctChoiceId: string,
  random: () => number = Math.random,
): ShuffledSnapshot {
  if (choices.length === 0) {
    throw new Error("choices array is empty");
  }

  const shuffled = fisherYatesShuffle([...choices], random);

  const correctIndex = shuffled.findIndex((c) => c.id === correctChoiceId);
  if (correctIndex === -1) {
    throw new Error(
      `correctChoiceId "${correctChoiceId}" not found in choices after shuffle`,
    );
  }

  return {
    choicesSnapshot: shuffled,
    correctChoiceIdSnapshot: correctChoiceId,
    correctIndexSnapshot: correctIndex,
  };
}
