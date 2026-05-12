import {
  selectQuizQuestions,
  buildQuestionPool,
  getDbCategoryFilter,
  getCategoryGroupForUser,
} from "./questionSelector";
import type { QuizQuestion } from "@/generated/prisma";
import type { AiGeneratedQuestion } from "./aiQuestionSlot";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeQuestion(overrides: Partial<QuizQuestion> & { id: string }): QuizQuestion {
  return {
    id: overrides.id,
    sourceId: overrides.sourceId ?? `src-${overrides.id}`,
    sourceType: overrides.sourceType ?? "common",
    categoryGroup: overrides.categoryGroup ?? "common",
    category: overrides.category ?? "common",
    questionType: overrides.questionType ?? "behavioral",
    difficulty: overrides.difficulty ?? "medium",
    question: overrides.question ?? "Tell me about yourself.",
    choices: overrides.choices ?? [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" },
      { id: "d", text: "D" },
    ],
    correctChoiceId: overrides.correctChoiceId ?? "a",
    correctExplanation: overrides.correctExplanation ?? "Explanation",
    wrongExplanations: overrides.wrongExplanations ?? { b: "wrong b", c: "wrong c", d: "wrong d" },
    tags: overrides.tags ?? ["general"],
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

function makePool(counts: { common: number; group: number; exact: number }) {
  return {
    common: Array.from({ length: counts.common }, (_, i) =>
      makeQuestion({ id: `c${i}`, category: "common", difficulty: i % 2 === 0 ? "easy" : "medium" })
    ),
    groupCommon: Array.from({ length: counts.group }, (_, i) =>
      makeQuestion({ id: `g${i}`, category: "tech-common", difficulty: "medium" })
    ),
    exactCategory: Array.from({ length: counts.exact }, (_, i) =>
      makeQuestion({ id: `e${i}`, category: "web-development", difficulty: i % 2 === 0 ? "medium" : "hard" })
    ),
  };
}

const deterministicRandom = () => 0.5;

const mockAiQuestion: AiGeneratedQuestion = {
  sourceId: "ai-001",
  sourceType: "ai_card_based",
  questionType: "role_specific",
  difficulty: "hard",
  question: "AI-generated question text",
  choices: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
    { id: "c", text: "C" },
    { id: "d", text: "D" },
  ],
  correctChoiceId: "b",
  correctExplanation: "Explanation",
  wrongExplanations: [
    { choiceId: "a", explanation: "wrong a" },
    { choiceId: "c", explanation: "wrong c" },
    { choiceId: "d", explanation: "wrong d" },
  ],
  tags: ["ai"],
  jobCardId: "job-001",
};

// ---------------------------------------------------------------------------
// selectQuizQuestions
// ---------------------------------------------------------------------------

describe("selectQuizQuestions — with active job card (AI available)", () => {
  const pool = makePool({ common: 5, group: 5, exact: 5 });

  it("returns ok with 4 DB questions + 1 AI question (total 5 slots)", () => {
    const result = selectQuizQuestions({
      userCategory: "web_development",
      pool,
      aiQuestion: mockAiQuestion,
      random: deterministicRandom,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // 2 common + 1 group + 1 exact = 4 DB questions
    expect(result.value.questions).toHaveLength(4);
    expect(result.value.aiSlot).not.toBeNull();
    expect(result.value.usedAiFallback).toBe(false);
  });

  it("total questions + AI slot equals 5", () => {
    const result = selectQuizQuestions({
      userCategory: "web_development",
      pool,
      aiQuestion: mockAiQuestion,
      random: deterministicRandom,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const total = result.value.questions.length + (result.value.aiSlot ? 1 : 0);
    expect(total).toBe(5);
  });
});

describe("selectQuizQuestions — without active job card (AI unavailable)", () => {
  const pool = makePool({ common: 5, group: 5, exact: 5 });

  it("returns 5 DB questions with no AI slot", () => {
    const result = selectQuizQuestions({
      userCategory: "web_development",
      pool,
      aiQuestion: null,
      random: deterministicRandom,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.questions).toHaveLength(5);
    expect(result.value.aiSlot).toBeNull();
    expect(result.value.usedAiFallback).toBe(true);
  });

  it("composition is common×2, group×1, exact×2", () => {
    const result = selectQuizQuestions({
      userCategory: "web_development",
      pool,
      aiQuestion: null,
      random: deterministicRandom,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const questions = result.value.questions;
    const commonCount = questions.filter((q) => q.category === "common").length;
    const groupCount = questions.filter((q) => q.category === "tech-common").length;
    const exactCount = questions.filter((q) => q.category === "web-development").length;
    expect(commonCount).toBe(2);
    expect(groupCount).toBe(1);
    expect(exactCount).toBe(2);
  });
});

describe("selectQuizQuestions — fallback when exact category runs short", () => {
  it("falls back to group-common when exact pool has 0 questions", () => {
    const pool = makePool({ common: 5, group: 10, exact: 0 });
    const result = selectQuizQuestions({
      userCategory: "web_development",
      pool,
      aiQuestion: null,
      random: deterministicRandom,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.questions).toHaveLength(5);
  });

  it("falls back to common when both group and exact pools are empty", () => {
    const pool = makePool({ common: 10, group: 0, exact: 0 });
    const result = selectQuizQuestions({
      userCategory: "web_development",
      pool,
      aiQuestion: null,
      random: deterministicRandom,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.questions).toHaveLength(5);
  });

  it("returns INSUFFICIENT_QUESTIONS if total pool < 5", () => {
    const pool = makePool({ common: 2, group: 1, exact: 0 });
    const result = selectQuizQuestions({
      userCategory: "web_development",
      pool,
      aiQuestion: null,
      random: deterministicRandom,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.error).toBe("INSUFFICIENT_QUESTIONS");
  });
});

describe("selectQuizQuestions — AI fallback (null AI → exact+1)", () => {
  it("uses exact×2 when AI is null, same as no-card composition", () => {
    const pool = makePool({ common: 5, group: 5, exact: 5 });
    const withAi = selectQuizQuestions({
      userCategory: "web_development",
      pool,
      aiQuestion: mockAiQuestion,
      random: deterministicRandom,
    });
    const withoutAi = selectQuizQuestions({
      userCategory: "web_development",
      pool,
      aiQuestion: null,
      random: deterministicRandom,
    });
    expect(withAi.ok && withoutAi.ok).toBe(true);
    if (!withAi.ok || !withoutAi.ok) return;
    // Without AI: 5 DB questions; with AI: 4 DB questions
    expect(withoutAi.value.questions.length).toBe(
      withAi.value.questions.length + 1,
    );
  });
});

describe("selectQuizQuestions — unsupported category (ESL/CELPIP)", () => {
  it("returns UNSUPPORTED_CATEGORY error for esl", () => {
    const pool = makePool({ common: 5, group: 5, exact: 5 });
    const result = selectQuizQuestions({
      userCategory: "esl",
      pool,
      aiQuestion: null,
      random: deterministicRandom,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.error).toBe("UNSUPPORTED_CATEGORY");
  });

  it("returns UNSUPPORTED_CATEGORY error for celpip", () => {
    const pool = makePool({ common: 5, group: 5, exact: 5 });
    const result = selectQuizQuestions({
      userCategory: "celpip",
      pool,
      aiQuestion: null,
      random: deterministicRandom,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.error).toBe("UNSUPPORTED_CATEGORY");
  });
});

describe("selectQuizQuestions — no duplicate questions selected", () => {
  it("all selected question IDs are unique", () => {
    const pool = makePool({ common: 5, group: 5, exact: 5 });
    const result = selectQuizQuestions({
      userCategory: "web_development",
      pool,
      aiQuestion: null,
      random: deterministicRandom,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ids = result.value.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("selectQuizQuestions — recent dedup preference", () => {
  it("avoids recently shown questions when fresh pool is available", () => {
    const pool = makePool({ common: 10, group: 5, exact: 5 });
    const recentIds = new Set(pool.common.slice(0, 8).map((q) => q.id));
    const result = selectQuizQuestions({
      userCategory: "web_development",
      pool,
      aiQuestion: null,
      recentlyShownIds: recentIds,
      random: deterministicRandom,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const pickedCommon = result.value.questions.filter(
      (q) => q.category === "common",
    );
    // Prefer the 2 non-recent common questions
    const nonRecentPicked = pickedCommon.filter((q) => !recentIds.has(q.id));
    expect(nonRecentPicked.length).toBeGreaterThan(0);
  });

  it("allows recently shown questions when pool is insufficient otherwise", () => {
    const pool = makePool({ common: 5, group: 5, exact: 5 });
    // Mark all common as recent — should still succeed
    const recentIds = new Set(pool.common.map((q) => q.id));
    const result = selectQuizQuestions({
      userCategory: "web_development",
      pool,
      aiQuestion: null,
      recentlyShownIds: recentIds,
      random: deterministicRandom,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.questions).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// buildQuestionPool
// ---------------------------------------------------------------------------

describe("buildQuestionPool", () => {
  it("partitions flat list into 3 tiers for web_development", () => {
    const questions: QuizQuestion[] = [
      makeQuestion({ id: "c1", category: "common" }),
      makeQuestion({ id: "g1", category: "tech-common" }),
      makeQuestion({ id: "e1", category: "web-development" }),
      makeQuestion({ id: "e2", category: "web-development" }),
    ];
    const pool = buildQuestionPool(questions, "web_development");
    expect(pool.common).toHaveLength(1);
    expect(pool.groupCommon).toHaveLength(1);
    expect(pool.exactCategory).toHaveLength(2);
  });

  it("ignores questions from unrelated categories", () => {
    const questions: QuizQuestion[] = [
      makeQuestion({ id: "c1", category: "common" }),
      makeQuestion({ id: "x1", category: "digital-marketing" }),
    ];
    const pool = buildQuestionPool(questions, "web_development");
    expect(pool.exactCategory).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getDbCategoryFilter
// ---------------------------------------------------------------------------

describe("getDbCategoryFilter", () => {
  it("returns [common, tech-common, web-development] for web_development", () => {
    expect(getDbCategoryFilter("web_development")).toEqual([
      "common",
      "tech-common",
      "web-development",
    ]);
  });

  it("returns [common, management-common, hospitality-management] for hospitality_management", () => {
    expect(getDbCategoryFilter("hospitality_management")).toEqual([
      "common",
      "management-common",
      "hospitality-management",
    ]);
  });
});

// ---------------------------------------------------------------------------
// getCategoryGroupForUser
// ---------------------------------------------------------------------------

describe("getCategoryGroupForUser", () => {
  it("returns tech for web_development", () => {
    expect(getCategoryGroupForUser("web_development")).toBe("tech");
  });

  it("returns management for hospitality_management", () => {
    expect(getCategoryGroupForUser("hospitality_management")).toBe("management");
  });

  it("returns marketing for digital_marketing", () => {
    expect(getCategoryGroupForUser("digital_marketing")).toBe("marketing");
  });

  it("returns null for unsupported category", () => {
    expect(getCategoryGroupForUser("esl")).toBeNull();
  });
});
