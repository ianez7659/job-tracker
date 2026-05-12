/**
 * sessionSerializer.test.ts
 *
 * Verifies that serializeSessionForClient correctly strips or includes
 * answer fields based on whether each item has been answered.
 */

import { serializeSessionForClient } from "./sessionSerializer";
import type { DailyQuizSession, DailyQuizSessionItem } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSession(overrides: Partial<DailyQuizSession> = {}): DailyQuizSession {
  return {
    id: "sess-001",
    userId: "user-001",
    dateKey: "2026-05-12",
    category: "web_development",
    categoryGroup: "tech",
    status: "in_progress",
    totalQuestions: 5,
    completedQuestions: 0,
    createdAt: new Date(),
    completedAt: null,
    ...overrides,
  };
}

function makeItem(
  overrides: Partial<DailyQuizSessionItem> & { id: string },
): DailyQuizSessionItem {
  return {
    sessionId: "sess-001",
    questionId: null,
    sourceType: "common",
    orderIndex: 0,
    renderedQuestionSnapshot: "What is the best way to handle X?",
    choicesSnapshot: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" },
      { id: "d", text: "D" },
    ],
    correctChoiceIdSnapshot: "b",
    correctIndexSnapshot: 1,
    correctExplanationSnapshot: "B is correct because...",
    wrongExplanationsSnapshot: [
      { choiceId: "a", explanation: "A is wrong because..." },
      { choiceId: "c", explanation: "C is wrong because..." },
      { choiceId: "d", explanation: "D is wrong because..." },
    ],
    userAnswerChoiceId: null,
    userAnswerIndex: null,
    isCorrect: null,
    answeredAt: null,
    metadata: null,
    ...overrides,
  };
}

const UNANSWERED = makeItem({ id: "item-1" });
const ANSWERED_CORRECT = makeItem({
  id: "item-2",
  orderIndex: 1,
  userAnswerChoiceId: "b",
  userAnswerIndex: 1,
  isCorrect: true,
  answeredAt: new Date(),
});
const ANSWERED_WRONG = makeItem({
  id: "item-3",
  orderIndex: 2,
  userAnswerChoiceId: "a",
  userAnswerIndex: 0,
  isCorrect: false,
  answeredAt: new Date(),
});

// ---------------------------------------------------------------------------
// Tests — unanswered items
// ---------------------------------------------------------------------------

describe("serializeSessionForClient — unanswered items", () => {
  it("omits correctChoiceIdSnapshot", () => {
    const { items } = serializeSessionForClient(makeSession(), [UNANSWERED]);
    expect(items[0]).not.toHaveProperty("correctChoiceIdSnapshot");
  });

  it("omits correctIndexSnapshot", () => {
    const { items } = serializeSessionForClient(makeSession(), [UNANSWERED]);
    expect(items[0]).not.toHaveProperty("correctIndexSnapshot");
  });

  it("omits correctExplanationSnapshot", () => {
    const { items } = serializeSessionForClient(makeSession(), [UNANSWERED]);
    expect(items[0]).not.toHaveProperty("correctExplanationSnapshot");
  });

  it("omits wrongExplanationsSnapshot", () => {
    const { items } = serializeSessionForClient(makeSession(), [UNANSWERED]);
    expect(items[0]).not.toHaveProperty("wrongExplanationsSnapshot");
  });

  it("sets answered: false", () => {
    const { items } = serializeSessionForClient(makeSession(), [UNANSWERED]);
    expect(items[0].answered).toBe(false);
  });

  it("retains question and choices", () => {
    const { items } = serializeSessionForClient(makeSession(), [UNANSWERED]);
    expect(items[0].renderedQuestionSnapshot).toBe(UNANSWERED.renderedQuestionSnapshot);
    expect(items[0].choicesSnapshot).toEqual(UNANSWERED.choicesSnapshot);
  });

  it("retains orderIndex and sourceType", () => {
    const { items } = serializeSessionForClient(makeSession(), [UNANSWERED]);
    expect(items[0].orderIndex).toBe(0);
    expect(items[0].sourceType).toBe("common");
  });

  it("retains null user answer fields", () => {
    const { items } = serializeSessionForClient(makeSession(), [UNANSWERED]);
    expect(items[0].userAnswerChoiceId).toBeNull();
    expect(items[0].isCorrect).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests — answered items
// ---------------------------------------------------------------------------

describe("serializeSessionForClient — answered items (correct)", () => {
  it("sets answered: true", () => {
    const { items } = serializeSessionForClient(makeSession(), [ANSWERED_CORRECT]);
    expect(items[0].answered).toBe(true);
  });

  it("includes correctChoiceIdSnapshot", () => {
    const { items } = serializeSessionForClient(makeSession(), [ANSWERED_CORRECT]);
    if (!items[0].answered) return;
    expect(items[0].correctChoiceIdSnapshot).toBe("b");
  });

  it("includes correctIndexSnapshot", () => {
    const { items } = serializeSessionForClient(makeSession(), [ANSWERED_CORRECT]);
    if (!items[0].answered) return;
    expect(items[0].correctIndexSnapshot).toBe(1);
  });

  it("includes correctExplanationSnapshot", () => {
    const { items } = serializeSessionForClient(makeSession(), [ANSWERED_CORRECT]);
    if (!items[0].answered) return;
    expect(items[0].correctExplanationSnapshot).toBe("B is correct because...");
  });

  it("includes wrongExplanationsSnapshot", () => {
    const { items } = serializeSessionForClient(makeSession(), [ANSWERED_CORRECT]);
    if (!items[0].answered) return;
    expect(Array.isArray(items[0].wrongExplanationsSnapshot)).toBe(true);
  });

  it("retains isCorrect and userAnswerChoiceId", () => {
    const { items } = serializeSessionForClient(makeSession(), [ANSWERED_CORRECT]);
    expect(items[0].isCorrect).toBe(true);
    expect(items[0].userAnswerChoiceId).toBe("b");
  });
});

describe("serializeSessionForClient — answered items (wrong)", () => {
  it("includes correctChoiceIdSnapshot even when user was wrong", () => {
    const { items } = serializeSessionForClient(makeSession(), [ANSWERED_WRONG]);
    if (!items[0].answered) return;
    expect(items[0].correctChoiceIdSnapshot).toBe("b");
  });

  it("retains isCorrect: false", () => {
    const { items } = serializeSessionForClient(makeSession(), [ANSWERED_WRONG]);
    expect(items[0].isCorrect).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests — mixed session (some answered, some not)
// ---------------------------------------------------------------------------

describe("serializeSessionForClient — mixed session", () => {
  const items = [UNANSWERED, ANSWERED_CORRECT, ANSWERED_WRONG];

  it("correctly classifies all three items", () => {
    const { items: result } = serializeSessionForClient(makeSession(), items);
    expect(result[0].answered).toBe(false);
    expect(result[1].answered).toBe(true);
    expect(result[2].answered).toBe(true);
  });

  it("only unanswered item lacks answer fields", () => {
    const { items: result } = serializeSessionForClient(makeSession(), items);
    expect(result[0]).not.toHaveProperty("correctChoiceIdSnapshot");
    expect(result[1]).toHaveProperty("correctChoiceIdSnapshot");
    expect(result[2]).toHaveProperty("correctChoiceIdSnapshot");
  });

  it("preserves item count and order", () => {
    const { items: result } = serializeSessionForClient(makeSession(), items);
    expect(result).toHaveLength(3);
    expect(result.map((i) => i.id)).toEqual(["item-1", "item-2", "item-3"]);
  });
});

// ---------------------------------------------------------------------------
// Tests — session passthrough
// ---------------------------------------------------------------------------

describe("serializeSessionForClient — session passthrough", () => {
  it("returns the session object unchanged", () => {
    const session = makeSession({ status: "completed" });
    const { session: result } = serializeSessionForClient(session, []);
    expect(result).toBe(session);
  });

  it("handles empty items array", () => {
    const { items } = serializeSessionForClient(makeSession(), []);
    expect(items).toHaveLength(0);
  });
});
