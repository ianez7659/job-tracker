import {
  validateQuestion,
  validateQuizFile,
  validateAllQuizFiles,
} from "./validation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeChoice(id: string, text = `Choice ${id}`) {
  return { id, text };
}

function makeWrongExplanation(choiceId: string) {
  return { choiceId, explanation: `Explanation for ${choiceId}` };
}

function makeValidQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: "test-question-001",
    sourceType: "category_specific",
    questionType: "behavioral",
    difficulty: "easy",
    question: "What is the best way to handle a disagreement?",
    choices: [
      makeChoice("a"),
      makeChoice("b"),
      makeChoice("c"),
      makeChoice("d"),
    ],
    correctChoiceId: "b",
    correctExplanation: "Option b is correct because it demonstrates collaboration.",
    wrongExplanations: [
      makeWrongExplanation("a"),
      makeWrongExplanation("c"),
      makeWrongExplanation("d"),
    ],
    tags: ["teamwork", "communication"],
    ...overrides,
  };
}

function makeValidFile(
  overrides: Record<string, unknown> = {},
  questionOverrides: Record<string, unknown> = {},
) {
  return {
    version: 1,
    category: "web-development",
    categoryGroup: "Tech",
    description: "Test file",
    questions: [makeValidQuestion(questionOverrides)],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validateQuestion
// ---------------------------------------------------------------------------

describe("validateQuestion", () => {
  it("passes a fully valid question", () => {
    const errors = validateQuestion(makeValidQuestion(), "test-category");
    expect(errors).toHaveLength(0);
  });

  it("fails when id is missing", () => {
    const q = makeValidQuestion({ id: "" });
    const errors = validateQuestion(q, "test");
    expect(errors.some((e) => e.field === "id")).toBe(true);
  });

  it("fails when sourceType is invalid", () => {
    const q = makeValidQuestion({ sourceType: "invalid_type" });
    const errors = validateQuestion(q, "test");
    expect(errors.some((e) => e.field === "sourceType")).toBe(true);
  });

  it("fails when questionType is invalid", () => {
    const q = makeValidQuestion({ questionType: "unknown" });
    const errors = validateQuestion(q, "test");
    expect(errors.some((e) => e.field === "questionType")).toBe(true);
  });

  it("accepts interview_basics as a valid questionType", () => {
    const q = makeValidQuestion({ questionType: "interview_basics" });
    const errors = validateQuestion(q, "test");
    expect(errors.filter((e) => e.field === "questionType")).toHaveLength(0);
  });

  it("fails when difficulty is invalid", () => {
    const q = makeValidQuestion({ difficulty: "very_hard" });
    const errors = validateQuestion(q, "test");
    expect(errors.some((e) => e.field === "difficulty")).toBe(true);
  });

  it("accepts all valid difficulty values", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const errors = validateQuestion(makeValidQuestion({ difficulty }), "test");
      expect(errors.filter((e) => e.field === "difficulty")).toHaveLength(0);
    }
  });

  it("fails when question text is empty", () => {
    const q = makeValidQuestion({ question: "   " });
    const errors = validateQuestion(q, "test");
    expect(errors.some((e) => e.field === "question")).toBe(true);
  });

  it("fails when choices has fewer than 4 items", () => {
    const q = makeValidQuestion({
      choices: [makeChoice("a"), makeChoice("b"), makeChoice("c")],
    });
    const errors = validateQuestion(q, "test");
    expect(errors.some((e) => e.field === "choices")).toBe(true);
  });

  it("fails when choices has more than 4 items", () => {
    const q = makeValidQuestion({
      choices: [
        makeChoice("a"),
        makeChoice("b"),
        makeChoice("c"),
        makeChoice("d"),
        makeChoice("e"),
      ],
    });
    const errors = validateQuestion(q, "test");
    expect(errors.some((e) => e.field === "choices")).toBe(true);
  });

  it("fails when a choice has an empty text", () => {
    const q = makeValidQuestion({
      choices: [
        makeChoice("a"),
        { id: "b", text: "" },
        makeChoice("c"),
        makeChoice("d"),
      ],
    });
    const errors = validateQuestion(q, "test");
    expect(errors.some((e) => e.field === "choices")).toBe(true);
  });

  it("fails when correctChoiceId does not match any choice id", () => {
    const q = makeValidQuestion({ correctChoiceId: "z" });
    const errors = validateQuestion(q, "test");
    expect(errors.some((e) => e.field === "correctChoiceId")).toBe(true);
  });

  it("fails when correctExplanation is empty", () => {
    const q = makeValidQuestion({ correctExplanation: "" });
    const errors = validateQuestion(q, "test");
    expect(errors.some((e) => e.field === "correctExplanation")).toBe(true);
  });

  it("fails when wrongExplanations is not an array", () => {
    const q = makeValidQuestion({ wrongExplanations: "not an array" });
    const errors = validateQuestion(q, "test");
    expect(errors.some((e) => e.field === "wrongExplanations")).toBe(true);
  });

  it("fails when a wrong choice has no wrongExplanation coverage", () => {
    // Correct is "b", so a, c, d need wrongExplanations — omit "c"
    const q = makeValidQuestion({
      wrongExplanations: [
        makeWrongExplanation("a"),
        makeWrongExplanation("d"),
        // missing "c"
      ],
    });
    const errors = validateQuestion(q, "test");
    expect(
      errors.some(
        (e) => e.field === "wrongExplanations" && e.message.includes('"c"'),
      ),
    ).toBe(true);
  });

  it("fails when tags is not an array", () => {
    const q = makeValidQuestion({ tags: "not-an-array" });
    const errors = validateQuestion(q, "test");
    expect(errors.some((e) => e.field === "tags")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateQuizFile
// ---------------------------------------------------------------------------

describe("validateQuizFile", () => {
  it("passes a fully valid file", () => {
    const result = validateQuizFile(makeValidFile(), "test-file.json");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.questionCount).toBe(1);
  });

  it("fails when version is missing", () => {
    const data = makeValidFile({ version: undefined });
    const result = validateQuizFile(data, "test.json");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "version")).toBe(true);
  });

  it("fails when category is empty", () => {
    const data = makeValidFile({ category: "" });
    const result = validateQuizFile(data, "test.json");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "category")).toBe(true);
  });

  it("fails when categoryGroup is missing", () => {
    const data = makeValidFile({ categoryGroup: "" });
    const result = validateQuizFile(data, "test.json");
    expect(result.valid).toBe(false);
  });

  it("fails when questions is not an array", () => {
    const data = makeValidFile({ questions: "not-array" });
    const result = validateQuizFile(data, "test.json");
    expect(result.valid).toBe(false);
  });

  it("fails on duplicate question ids within a file", () => {
    const file = {
      version: 1,
      category: "web-development",
      categoryGroup: "Tech",
      questions: [
        makeValidQuestion({ id: "dup-001" }),
        makeValidQuestion({ id: "dup-001" }), // duplicate
      ],
    };
    const result = validateQuizFile(file, "test.json");
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.message.includes("duplicate")),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateAllQuizFiles
// ---------------------------------------------------------------------------

describe("validateAllQuizFiles", () => {
  it("passes when all files are valid", () => {
    const files = [
      { fileName: "file1.json", data: makeValidFile({}, { id: "q-001" }) },
      {
        fileName: "file2.json",
        data: makeValidFile({ category: "ui-ux-design" }, { id: "q-002" }),
      },
    ];
    const result = validateAllQuizFiles(files);
    expect(result.valid).toBe(true);
    expect(result.questionCount).toBe(2);
  });

  it("fails when a question id is duplicated across files", () => {
    const files = [
      { fileName: "file1.json", data: makeValidFile({}, { id: "shared-id" }) },
      {
        fileName: "file2.json",
        data: makeValidFile({ category: "cybersecurity" }, { id: "shared-id" }),
      },
    ];
    const result = validateAllQuizFiles(files);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.message.includes("duplicate id across files")),
    ).toBe(true);
  });

  it("aggregates errors from multiple files", () => {
    const files = [
      {
        fileName: "bad1.json",
        data: makeValidFile({ category: "" }, { id: "q-1" }),
      },
      {
        fileName: "bad2.json",
        data: makeValidFile({ categoryGroup: "" }, { id: "q-2" }),
      },
    ];
    const result = validateAllQuizFiles(files);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
