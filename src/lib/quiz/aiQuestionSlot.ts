/**
 * aiQuestionSlot.ts
 *
 * Generates one AI card-based interview practice question per Daily Quiz session
 * using OpenAI Structured Outputs (json_schema, strict: true).
 *
 * Returns null on any failure — the session engine falls back to an extra
 * exact-category question automatically. Users never see raw AI errors.
 *
 * Cost / call policy:
 *   - Called once per session creation only.
 *   - If it returns null, the session is saved with fallback questions and
 *     AI is NOT retried for the same day (snapshot already committed).
 *   - New-day sessions start fresh — a new attempt is made.
 */

import OpenAI from "openai";
import type { QuizChoiceRaw } from "./choiceShuffler";

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface AiQuestionWrongExplanation {
  choiceId: string;
  explanation: string;
}

export interface AiGeneratedQuestion {
  /** Unique ID for this AI question (not in QuizQuestion table) */
  sourceId: string;
  sourceType: "ai_card_based";
  questionType: "role_specific";
  difficulty: "medium" | "hard";
  question: string;
  choices: QuizChoiceRaw[];
  correctChoiceId: string;
  correctExplanation: string;
  wrongExplanations: AiQuestionWrongExplanation[];
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

// ---------------------------------------------------------------------------
// JSON Schema for Structured Output
// ---------------------------------------------------------------------------

/**
 * Strict JSON Schema passed to OpenAI as response_format.
 * strict: true enforces exact schema adherence.
 * additionalProperties: false is required at every object level in strict mode.
 *
 * minItems/maxItems are NOT used (not supported in strict mode).
 * Count validation is performed server-side in validateAiQuestionResponse().
 */
const AI_QUESTION_SCHEMA = {
  name: "quiz_question",
  strict: true,
  schema: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "The interview practice question in English.",
      },
      choices: {
        type: "array",
        description: "Exactly 4 answer choices with ids a, b, c, d.",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              enum: ["a", "b", "c", "d"],
              description: "Stable choice identifier.",
            },
            text: {
              type: "string",
              description: "The choice text.",
            },
          },
          required: ["id", "text"],
          additionalProperties: false,
        },
      },
      correctChoiceId: {
        type: "string",
        enum: ["a", "b", "c", "d"],
        description: "The id of the correct choice.",
      },
      correctExplanation: {
        type: "string",
        description: "Why the correct choice is the best answer.",
      },
      wrongExplanations: {
        type: "array",
        description: "Explanations for each of the 3 incorrect choices.",
        items: {
          type: "object",
          properties: {
            choiceId: {
              type: "string",
              enum: ["a", "b", "c", "d"],
              description: "The id of the incorrect choice.",
            },
            explanation: {
              type: "string",
              description: "Why this choice is incorrect.",
            },
          },
          required: ["choiceId", "explanation"],
          additionalProperties: false,
        },
      },
      difficulty: {
        type: "string",
        enum: ["medium", "hard"],
        description: "Question difficulty level.",
      },
      tags: {
        type: "array",
        description: "2-4 topic tags.",
        items: { type: "string" },
      },
    },
    required: [
      "question",
      "choices",
      "correctChoiceId",
      "correctExplanation",
      "wrongExplanations",
      "difficulty",
      "tags",
    ],
    additionalProperties: false,
  },
} as const;

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert interview coach generating realistic, practical interview practice questions.

Rules:
- Output must be valid JSON only. Do not include markdown, code blocks, or any text outside the JSON.
- Create exactly one multiple-choice interview practice question.
- The question MUST be in English.
- The question must be based on the provided job card context (company, role, stage, and JD if available).
- Create exactly 4 answer choices with ids: a, b, c, d.
- Only one choice should be clearly correct. Avoid questions with multiple defensible answers.
- Use correctChoiceId (not an index) to indicate the correct answer.
- Include correctExplanation explaining why the correct answer is best.
- Include wrongExplanations for each of the 3 incorrect choices, explaining why they are suboptimal.
- Set difficulty to "medium" or "hard" — appropriate for a real interview.
- The question must be practical and relevant to interview preparation for the given role.
- Do not fabricate specific company facts or reveal private details.
- Avoid vague or subjective questions. The correct answer must be clearly superior.`;

function buildUserPrompt(input: AiQuestionSlotInput): string {
  const stageLabel: Record<string, string> = {
    applying: "application submitted",
    resume: "resume review / screening",
    interview1: "first interview",
    interview2: "second interview",
    interview3: "final interview",
  };

  const lines = [
    `Job role: ${input.jobTitle}`,
    `Company: ${input.jobCompany}`,
    `Interview stage: ${stageLabel[input.jobStage] ?? input.jobStage}`,
    `Candidate category: ${input.userCategory.replace(/_/g, " ")}`,
  ];

  if (input.jd && input.jd.trim().length > 0) {
    const excerpt = input.jd.trim().slice(0, 2_000);
    lines.push(`\nJob description excerpt:\n---\n${excerpt}\n---`);
  }

  lines.push(
    "\nGenerate one interview practice question relevant to this job card context.",
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Server-side validation
// ---------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
}

export interface AiValidationResult {
  ok: boolean;
  errors: ValidationError[];
}

const VALID_IDS = new Set(["a", "b", "c", "d"]);
const VALID_DIFFICULTIES = new Set(["medium", "hard"]);

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Server-side validation performed after OpenAI responds.
 * Independent of the structured output guarantee — catches any edge cases.
 * Returns all errors found (not just the first).
 */
export function validateAiQuestionResponse(raw: unknown): AiValidationResult {
  const errors: ValidationError[] = [];

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      errors: [{ field: "root", message: "Response is not an object" }],
    };
  }

  const r = raw as Record<string, unknown>;

  // question
  if (!isNonEmptyString(r.question)) {
    errors.push({ field: "question", message: "Must be a non-empty string" });
  }

  // choices — exactly 4, ids must be a/b/c/d (no duplicates), text non-empty
  if (!Array.isArray(r.choices)) {
    errors.push({ field: "choices", message: "Must be an array" });
  } else if (r.choices.length !== 4) {
    errors.push({
      field: "choices",
      message: `Must have exactly 4 items, got ${r.choices.length}`,
    });
  } else {
    const seenIds = new Set<string>();
    r.choices.forEach((c: unknown, i: number) => {
      if (!c || typeof c !== "object" || Array.isArray(c)) {
        errors.push({ field: `choices[${i}]`, message: "Must be an object" });
        return;
      }
      const choice = c as Record<string, unknown>;
      if (typeof choice.id !== "string" || !VALID_IDS.has(choice.id)) {
        errors.push({
          field: `choices[${i}].id`,
          message: `Must be one of a/b/c/d, got "${choice.id}"`,
        });
      } else {
        if (seenIds.has(choice.id)) {
          errors.push({
            field: `choices[${i}].id`,
            message: `Duplicate choice id "${choice.id}"`,
          });
        }
        seenIds.add(choice.id);
      }
      if (!isNonEmptyString(choice.text)) {
        errors.push({
          field: `choices[${i}].text`,
          message: "Must be a non-empty string",
        });
      }
    });
  }

  // correctChoiceId
  if (typeof r.correctChoiceId !== "string" || !VALID_IDS.has(r.correctChoiceId)) {
    errors.push({
      field: "correctChoiceId",
      message: `Must be one of a/b/c/d, got "${r.correctChoiceId}"`,
    });
  } else if (Array.isArray(r.choices) && r.choices.length === 4) {
    const choiceIds = (r.choices as Array<Record<string, unknown>>)
      .map((c) => c.id)
      .filter((id): id is string => typeof id === "string");
    if (!choiceIds.includes(r.correctChoiceId)) {
      errors.push({
        field: "correctChoiceId",
        message: `"${r.correctChoiceId}" not found in choices`,
      });
    }
  }

  // correctExplanation
  if (!isNonEmptyString(r.correctExplanation)) {
    errors.push({
      field: "correctExplanation",
      message: "Must be a non-empty string",
    });
  }

  // wrongExplanations — exactly 3, covering non-correct choices
  if (!Array.isArray(r.wrongExplanations)) {
    errors.push({ field: "wrongExplanations", message: "Must be an array" });
  } else if (r.wrongExplanations.length !== 3) {
    errors.push({
      field: "wrongExplanations",
      message: `Must have exactly 3 items, got ${r.wrongExplanations.length}`,
    });
  } else {
    r.wrongExplanations.forEach((w: unknown, i: number) => {
      if (!w || typeof w !== "object" || Array.isArray(w)) {
        errors.push({
          field: `wrongExplanations[${i}]`,
          message: "Must be an object",
        });
        return;
      }
      const we = w as Record<string, unknown>;
      if (typeof we.choiceId !== "string" || !VALID_IDS.has(we.choiceId)) {
        errors.push({
          field: `wrongExplanations[${i}].choiceId`,
          message: `Must be one of a/b/c/d, got "${we.choiceId}"`,
        });
      } else if (
        isNonEmptyString(r.correctChoiceId) &&
        we.choiceId === r.correctChoiceId
      ) {
        errors.push({
          field: `wrongExplanations[${i}].choiceId`,
          message: `"${we.choiceId}" is the correct answer — wrongExplanations must only cover incorrect choices`,
        });
      }
      if (!isNonEmptyString(we.explanation)) {
        errors.push({
          field: `wrongExplanations[${i}].explanation`,
          message: "Must be a non-empty string",
        });
      }
    });
  }

  // difficulty
  if (
    typeof r.difficulty !== "string" ||
    !VALID_DIFFICULTIES.has(r.difficulty)
  ) {
    errors.push({
      field: "difficulty",
      message: `Must be "medium" or "hard", got "${r.difficulty}"`,
    });
  }

  // tags
  if (!Array.isArray(r.tags)) {
    errors.push({ field: "tags", message: "Must be an array" });
  } else if (r.tags.some((t) => typeof t !== "string")) {
    errors.push({ field: "tags", message: "All items must be strings" });
  }

  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

const AI_TIMEOUT_MS = 20_000;

/**
 * Attempts to generate an AI card-based quiz question using OpenAI Structured Outputs.
 *
 * Returns null on any failure (API error, timeout, validation failure).
 * The session engine will fall back to an extra exact-category question.
 */
export async function generateAiQuizQuestion(
  input: AiQuestionSlotInput,
): Promise<AiGeneratedQuestion | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[quiz/ai] OPENAI_API_KEY not set — skipping AI question");
    return null;
  }

  const openai = new OpenAI({ apiKey });
  let rawContent: string | null = null;

  try {
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: AI_QUESTION_SCHEMA,
        },
        max_tokens: 800,
        temperature: 0.7,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("AI question generation timed out")),
          AI_TIMEOUT_MS,
        ),
      ),
    ]);

    rawContent = completion.choices[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.warn(
      "[quiz/ai] OpenAI call failed:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }

  if (!rawContent) {
    console.warn("[quiz/ai] Empty response from OpenAI");
    return null;
  }

  // Parse JSON (structured output should always be valid, but guard anyway)
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    console.warn("[quiz/ai] Failed to parse OpenAI response as JSON");
    return null;
  }

  // Server-side validation — independent of structured output guarantee
  const validation = validateAiQuestionResponse(parsed);
  if (!validation.ok) {
    console.warn(
      "[quiz/ai] Validation failed:",
      validation.errors.map((e) => `${e.field}: ${e.message}`).join("; "),
    );
    return null;
  }

  // Safe cast after validation passes
  const r = parsed as {
    question: string;
    choices: Array<{ id: string; text: string }>;
    correctChoiceId: string;
    correctExplanation: string;
    wrongExplanations: Array<{ choiceId: string; explanation: string }>;
    difficulty: "medium" | "hard";
    tags: string[];
  };

  const sourceId = `ai-${input.userId}-${input.jobCardId}-${Date.now()}`;

  return {
    sourceId,
    sourceType: "ai_card_based",
    questionType: "role_specific",
    difficulty: r.difficulty,
    question: r.question,
    choices: r.choices,
    correctChoiceId: r.correctChoiceId,
    correctExplanation: r.correctExplanation,
    wrongExplanations: r.wrongExplanations,
    tags: r.tags,
    jobCardId: input.jobCardId,
  };
}
