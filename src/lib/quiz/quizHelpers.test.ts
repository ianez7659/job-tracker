/**
 * quizHelpers.test.ts
 *
 * Unit tests for pure quiz client helper functions.
 */

import {
  findFirstUnansweredIndex,
  computeCorrectCount,
  computePercentComplete,
  findWrongExplanation,
  isSessionComplete,
} from "./quizHelpers";
import type { QuizItem } from "./quizClientTypes";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeUnanswered(id: string, orderIndex = 0): QuizItem {
  return {
    id,
    sessionId: "sess-1",
    questionId: null,
    sourceType: "common",
    orderIndex,
    renderedQuestionSnapshot: "Question?",
    choicesSnapshot: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" },
      { id: "d", text: "D" },
    ],
    userAnswerChoiceId: null,
    userAnswerIndex: null,
    isCorrect: null,
    answeredAt: null,
    metadata: null,
    answered: false,
  };
}

function makeAnswered(id: string, isCorrect: boolean, orderIndex = 0): QuizItem {
  return {
    id,
    sessionId: "sess-1",
    questionId: null,
    sourceType: "common",
    orderIndex,
    renderedQuestionSnapshot: "Question?",
    choicesSnapshot: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" },
      { id: "d", text: "D" },
    ],
    userAnswerChoiceId: isCorrect ? "b" : "a",
    userAnswerIndex: isCorrect ? 1 : 0,
    isCorrect,
    answeredAt: "2026-05-12T10:00:00Z",
    metadata: null,
    answered: true,
    correctChoiceIdSnapshot: "b",
    correctIndexSnapshot: 1,
    correctExplanationSnapshot: "B is correct.",
    wrongExplanationsSnapshot: [
      { choiceId: "a", explanation: "A is wrong." },
      { choiceId: "c", explanation: "C is wrong." },
      { choiceId: "d", explanation: "D is wrong." },
    ],
  };
}

// ---------------------------------------------------------------------------
// findFirstUnansweredIndex
// ---------------------------------------------------------------------------

describe("findFirstUnansweredIndex", () => {
  it("returns 0 when all items are unanswered", () => {
    const items = [makeUnanswered("i1"), makeUnanswered("i2"), makeUnanswered("i3")];
    expect(findFirstUnansweredIndex(items)).toBe(0);
  });

  it("returns first unanswered index when some are answered", () => {
    const items = [makeAnswered("i1", true), makeAnswered("i2", false), makeUnanswered("i3")];
    expect(findFirstUnansweredIndex(items)).toBe(2);
  });

  it("returns -1 when all items are answered", () => {
    const items = [makeAnswered("i1", true), makeAnswered("i2", false)];
    expect(findFirstUnansweredIndex(items)).toBe(-1);
  });

  it("returns -1 for empty array", () => {
    expect(findFirstUnansweredIndex([])).toBe(-1);
  });
});

// ---------------------------------------------------------------------------
// computeCorrectCount
// ---------------------------------------------------------------------------

describe("computeCorrectCount", () => {
  it("returns 0 for no items", () => {
    expect(computeCorrectCount([])).toBe(0);
  });

  it("returns 0 when all are wrong", () => {
    const items = [makeAnswered("i1", false), makeAnswered("i2", false)];
    expect(computeCorrectCount(items)).toBe(0);
  });

  it("counts only correct items", () => {
    const items = [
      makeAnswered("i1", true),
      makeAnswered("i2", false),
      makeAnswered("i3", true),
      makeUnanswered("i4"),
    ];
    expect(computeCorrectCount(items)).toBe(2);
  });

  it("returns total when all are correct", () => {
    const items = [makeAnswered("i1", true), makeAnswered("i2", true)];
    expect(computeCorrectCount(items)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// computePercentComplete
// ---------------------------------------------------------------------------

describe("computePercentComplete", () => {
  it("returns 0 when total is 0", () => {
    expect(computePercentComplete(0, 0)).toBe(0);
  });

  it("returns 0 for 0/5", () => {
    expect(computePercentComplete(0, 5)).toBe(0);
  });

  it("returns 20 for 1/5", () => {
    expect(computePercentComplete(1, 5)).toBe(20);
  });

  it("returns 60 for 3/5", () => {
    expect(computePercentComplete(3, 5)).toBe(60);
  });

  it("returns 100 for 5/5", () => {
    expect(computePercentComplete(5, 5)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// findWrongExplanation
// ---------------------------------------------------------------------------

describe("findWrongExplanation", () => {
  const explanations = [
    { choiceId: "a", explanation: "A is wrong." },
    { choiceId: "c", explanation: "C is wrong." },
    { choiceId: "d", explanation: "D is wrong." },
  ];

  it("returns the explanation for a matching choiceId", () => {
    expect(findWrongExplanation(explanations, "a")).toBe("A is wrong.");
  });

  it("returns undefined for a non-existent choiceId", () => {
    expect(findWrongExplanation(explanations, "b")).toBeUndefined();
  });

  it("returns undefined for empty array", () => {
    expect(findWrongExplanation([], "a")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// isSessionComplete
// ---------------------------------------------------------------------------

describe("isSessionComplete", () => {
  it("returns true for 'completed'", () => {
    expect(isSessionComplete("completed")).toBe(true);
  });

  it("returns false for 'in_progress'", () => {
    expect(isSessionComplete("in_progress")).toBe(false);
  });

  it("returns false for 'not_started'", () => {
    expect(isSessionComplete("not_started")).toBe(false);
  });
});
