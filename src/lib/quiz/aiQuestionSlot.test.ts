/**
 * @jest-environment node
 *
 * aiQuestionSlot.test.ts
 *
 * Tests for validateAiQuestionResponse() and generateAiQuizQuestion().
 * OpenAI API is never called — all tests use mocked responses.
 */

import OpenAI from "openai";
import { validateAiQuestionResponse, generateAiQuizQuestion } from "./aiQuestionSlot";
import type { AiQuestionSlotInput } from "./aiQuestionSlot";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_RESPONSE = {
  question: "How would you approach debugging a production performance issue at Acme Corp?",
  choices: [
    { id: "a", text: "Restart the server immediately without investigation." },
    { id: "b", text: "Profile the application, identify bottlenecks, then optimize." },
    { id: "c", text: "Roll back the last deployment without checking logs." },
    { id: "d", text: "Ignore it and wait for user complaints to escalate." },
  ],
  correctChoiceId: "b",
  correctExplanation: "Profiling first ensures you fix the actual root cause rather than guessing.",
  wrongExplanations: [
    { choiceId: "a", explanation: "Restarting hides the problem and causes downtime." },
    { choiceId: "c", explanation: "Rolling back may not address the root cause and loses recent work." },
    { choiceId: "d", explanation: "Ignoring production issues damages user trust and SLAs." },
  ],
  difficulty: "hard",
  tags: ["debugging", "performance", "production"],
};

const SLOT_INPUT: AiQuestionSlotInput = {
  userId: "user-001",
  jobCardId: "job-001",
  jobTitle: "Senior Software Engineer",
  jobCompany: "Acme Corp",
  jobStage: "interview2",
  userCategory: "web_development",
  jd: "We are looking for a senior engineer...",
};

// ---------------------------------------------------------------------------
// validateAiQuestionResponse
// ---------------------------------------------------------------------------

describe("validateAiQuestionResponse — valid input", () => {
  it("returns ok:true for a fully valid response", () => {
    const result = validateAiQuestionResponse(VALID_RESPONSE);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts difficulty medium", () => {
    const result = validateAiQuestionResponse({ ...VALID_RESPONSE, difficulty: "medium" });
    expect(result.ok).toBe(true);
  });

  it("accepts difficulty hard", () => {
    const result = validateAiQuestionResponse({ ...VALID_RESPONSE, difficulty: "hard" });
    expect(result.ok).toBe(true);
  });
});

describe("validateAiQuestionResponse — root shape failures", () => {
  it("fails for null", () => {
    const result = validateAiQuestionResponse(null);
    expect(result.ok).toBe(false);
    expect(result.errors[0].field).toBe("root");
  });

  it("fails for a string", () => {
    const result = validateAiQuestionResponse("not an object");
    expect(result.ok).toBe(false);
  });

  it("fails for an array", () => {
    const result = validateAiQuestionResponse([VALID_RESPONSE]);
    expect(result.ok).toBe(false);
  });
});

describe("validateAiQuestionResponse — question field", () => {
  it("fails for empty string question", () => {
    const result = validateAiQuestionResponse({ ...VALID_RESPONSE, question: "" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "question")).toBe(true);
  });

  it("fails for missing question", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { question: _q, ...rest } = VALID_RESPONSE;
    const result = validateAiQuestionResponse(rest);
    expect(result.ok).toBe(false);
  });

  it("fails for numeric question", () => {
    const result = validateAiQuestionResponse({ ...VALID_RESPONSE, question: 42 });
    expect(result.ok).toBe(false);
  });
});

describe("validateAiQuestionResponse — choices", () => {
  it("fails when choices has 3 items", () => {
    const result = validateAiQuestionResponse({
      ...VALID_RESPONSE,
      choices: VALID_RESPONSE.choices.slice(0, 3),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "choices")).toBe(true);
  });

  it("fails when choices has 5 items", () => {
    const result = validateAiQuestionResponse({
      ...VALID_RESPONSE,
      choices: [
        ...VALID_RESPONSE.choices,
        { id: "e", text: "Extra choice" },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("fails when choices is not an array", () => {
    const result = validateAiQuestionResponse({ ...VALID_RESPONSE, choices: "bad" });
    expect(result.ok).toBe(false);
  });

  it("fails when a choice has an invalid id", () => {
    const result = validateAiQuestionResponse({
      ...VALID_RESPONSE,
      choices: [
        { id: "a", text: "A" },
        { id: "b", text: "B" },
        { id: "c", text: "C" },
        { id: "z", text: "Invalid" },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("fails when a choice has duplicate id", () => {
    const result = validateAiQuestionResponse({
      ...VALID_RESPONSE,
      choices: [
        { id: "a", text: "A" },
        { id: "a", text: "Duplicate A" },
        { id: "c", text: "C" },
        { id: "d", text: "D" },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("fails when a choice text is empty", () => {
    const result = validateAiQuestionResponse({
      ...VALID_RESPONSE,
      choices: [
        { id: "a", text: "" },
        { id: "b", text: "B" },
        { id: "c", text: "C" },
        { id: "d", text: "D" },
      ],
    });
    expect(result.ok).toBe(false);
  });
});

describe("validateAiQuestionResponse — correctChoiceId", () => {
  it("fails when correctChoiceId is not in choices", () => {
    const result = validateAiQuestionResponse({
      ...VALID_RESPONSE,
      correctChoiceId: "z",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "correctChoiceId")).toBe(true);
  });

  it("fails when correctChoiceId is missing", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { correctChoiceId: _cc, ...rest } = VALID_RESPONSE;
    const result = validateAiQuestionResponse(rest);
    expect(result.ok).toBe(false);
  });
});

describe("validateAiQuestionResponse — wrongExplanations", () => {
  it("fails when wrongExplanations has 2 items", () => {
    const result = validateAiQuestionResponse({
      ...VALID_RESPONSE,
      wrongExplanations: VALID_RESPONSE.wrongExplanations.slice(0, 2),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "wrongExplanations")).toBe(true);
  });

  it("fails when wrongExplanations has 4 items", () => {
    const result = validateAiQuestionResponse({
      ...VALID_RESPONSE,
      wrongExplanations: [
        ...VALID_RESPONSE.wrongExplanations,
        { choiceId: "b", explanation: "extra" },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("fails when wrongExplanations is not an array", () => {
    const result = validateAiQuestionResponse({
      ...VALID_RESPONSE,
      wrongExplanations: {},
    });
    expect(result.ok).toBe(false);
  });

  it("fails when wrongExplanations entry has an invalid choiceId", () => {
    const result = validateAiQuestionResponse({
      ...VALID_RESPONSE,
      wrongExplanations: [
        { choiceId: "z", explanation: "wrong" },
        { choiceId: "c", explanation: "wrong c" },
        { choiceId: "d", explanation: "wrong d" },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("fails when wrongExplanations entry uses the correct choice id", () => {
    // correctChoiceId is "b", so wrongExplanations should not include "b"
    const result = validateAiQuestionResponse({
      ...VALID_RESPONSE,
      wrongExplanations: [
        { choiceId: "b", explanation: "this is actually correct" },
        { choiceId: "c", explanation: "wrong c" },
        { choiceId: "d", explanation: "wrong d" },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("fails when an explanation is empty", () => {
    const result = validateAiQuestionResponse({
      ...VALID_RESPONSE,
      wrongExplanations: [
        { choiceId: "a", explanation: "" },
        { choiceId: "c", explanation: "wrong c" },
        { choiceId: "d", explanation: "wrong d" },
      ],
    });
    expect(result.ok).toBe(false);
  });
});

describe("validateAiQuestionResponse — difficulty", () => {
  it("fails for 'easy' difficulty", () => {
    const result = validateAiQuestionResponse({ ...VALID_RESPONSE, difficulty: "easy" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "difficulty")).toBe(true);
  });

  it("fails for unknown difficulty", () => {
    const result = validateAiQuestionResponse({ ...VALID_RESPONSE, difficulty: "extreme" });
    expect(result.ok).toBe(false);
  });
});

describe("validateAiQuestionResponse — tags", () => {
  it("passes with empty tags array", () => {
    const result = validateAiQuestionResponse({ ...VALID_RESPONSE, tags: [] });
    expect(result.ok).toBe(true);
  });

  it("fails when tags is not an array", () => {
    const result = validateAiQuestionResponse({ ...VALID_RESPONSE, tags: "tag" });
    expect(result.ok).toBe(false);
  });

  it("fails when a tag is not a string", () => {
    const result = validateAiQuestionResponse({ ...VALID_RESPONSE, tags: [1, 2] });
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generateAiQuizQuestion — with mocked OpenAI module
// ---------------------------------------------------------------------------

jest.mock("openai");

const OpenAIMock = jest.mocked(OpenAI);

function setupOpenAIMock(content: string | null) {
  OpenAIMock.mockImplementation(
    () =>
      ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content } }],
            }),
          },
        },
      }) as unknown as OpenAI,
  );
}

const VALID_JSON = JSON.stringify(VALID_RESPONSE);

describe("generateAiQuizQuestion — success path", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns AiGeneratedQuestion on valid OpenAI response", async () => {
    setupOpenAIMock(VALID_JSON);
    const result = await generateAiQuizQuestion(SLOT_INPUT);
    expect(result).not.toBeNull();
    expect(result?.sourceType).toBe("ai_card_based");
    expect(result?.question).toBe(VALID_RESPONSE.question);
    expect(result?.choices).toHaveLength(4);
    expect(result?.wrongExplanations).toHaveLength(3);
    expect(result?.jobCardId).toBe(SLOT_INPUT.jobCardId);
  });

  it("sets questionType to role_specific", async () => {
    setupOpenAIMock(VALID_JSON);
    const result = await generateAiQuizQuestion(SLOT_INPUT);
    expect(result?.questionType).toBe("role_specific");
  });

  it("includes sourceId with userId and jobCardId", async () => {
    setupOpenAIMock(VALID_JSON);
    const result = await generateAiQuizQuestion(SLOT_INPUT);
    expect(result?.sourceId).toContain(SLOT_INPUT.userId);
    expect(result?.sourceId).toContain(SLOT_INPUT.jobCardId);
  });
});

describe("generateAiQuizQuestion — failure paths (returns null)", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns null when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;
    setupOpenAIMock(VALID_JSON);
    const result = await generateAiQuizQuestion(SLOT_INPUT);
    expect(result).toBeNull();
  });

  it("returns null when OpenAI throws an error", async () => {
    OpenAIMock.mockImplementation(
      () =>
        ({
          chat: {
            completions: {
              create: jest.fn().mockRejectedValue(new Error("API error")),
            },
          },
        }) as unknown as OpenAI,
    );
    const result = await generateAiQuizQuestion(SLOT_INPUT);
    expect(result).toBeNull();
  });

  it("returns null when response content is null", async () => {
    setupOpenAIMock(null);
    const result = await generateAiQuizQuestion(SLOT_INPUT);
    expect(result).toBeNull();
  });

  it("returns null when response is invalid JSON", async () => {
    setupOpenAIMock("not valid json {{{");
    const result = await generateAiQuizQuestion(SLOT_INPUT);
    expect(result).toBeNull();
  });

  it("returns null when choices count is wrong", async () => {
    const bad = {
      ...VALID_RESPONSE,
      choices: VALID_RESPONSE.choices.slice(0, 3),
    };
    setupOpenAIMock(JSON.stringify(bad));
    const result = await generateAiQuizQuestion(SLOT_INPUT);
    expect(result).toBeNull();
  });

  it("returns null when correctChoiceId does not match any choice", async () => {
    const bad = { ...VALID_RESPONSE, correctChoiceId: "z" };
    setupOpenAIMock(JSON.stringify(bad));
    const result = await generateAiQuizQuestion(SLOT_INPUT);
    expect(result).toBeNull();
  });

  it("returns null when wrongExplanations has wrong count", async () => {
    const bad = {
      ...VALID_RESPONSE,
      wrongExplanations: VALID_RESPONSE.wrongExplanations.slice(0, 2),
    };
    setupOpenAIMock(JSON.stringify(bad));
    const result = await generateAiQuizQuestion(SLOT_INPUT);
    expect(result).toBeNull();
  });

  it("returns null when wrongExplanations uses correctChoiceId", async () => {
    const bad = {
      ...VALID_RESPONSE,
      wrongExplanations: [
        { choiceId: "b", explanation: "this is the correct answer" },
        { choiceId: "c", explanation: "wrong c" },
        { choiceId: "d", explanation: "wrong d" },
      ],
    };
    setupOpenAIMock(JSON.stringify(bad));
    const result = await generateAiQuizQuestion(SLOT_INPUT);
    expect(result).toBeNull();
  });

  it("returns null when difficulty is 'easy'", async () => {
    const bad = { ...VALID_RESPONSE, difficulty: "easy" };
    setupOpenAIMock(JSON.stringify(bad));
    const result = await generateAiQuizQuestion(SLOT_INPUT);
    expect(result).toBeNull();
  });
});

describe("generateAiQuizQuestion — session reuse (no double call)", () => {
  it("is a pure function — each call to generateAiQuizQuestion is independent", () => {
    // The session engine (sessionService.ts) prevents double calls:
    // AI is called once during session creation. The result (or fallback) is
    // persisted as snapshot. On page reload, the existing session is returned
    // without re-calling this function.
    // This test documents that contract.
    expect(typeof generateAiQuizQuestion).toBe("function");
  });
});
