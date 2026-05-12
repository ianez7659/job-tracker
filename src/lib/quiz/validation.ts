/**
 * Validation for data/quiz/*.questions.json source files.
 *
 * All content must be in English; this validator does not auto-detect language
 * but enforces structural rules before import.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const ALLOWED_DIFFICULTY = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof ALLOWED_DIFFICULTY)[number];

export const ALLOWED_QUESTION_TYPES = [
  "behavioral",
  "situational",
  "role_specific",
  "interview_basics", // used in common questions only
] as const;
export type QuestionType = (typeof ALLOWED_QUESTION_TYPES)[number];

export const ALLOWED_SOURCE_TYPES = [
  "common",
  "group_common",
  "category_specific",
  "ai_card_based",
] as const;
export type SourceType = (typeof ALLOWED_SOURCE_TYPES)[number];

export interface QuizChoice {
  id: string;
  text: string;
}

export interface QuizWrongExplanation {
  choiceId: string;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  sourceType: SourceType;
  questionType: QuestionType;
  difficulty: Difficulty;
  question: string;
  choices: QuizChoice[];
  correctChoiceId: string;
  correctExplanation: string;
  wrongExplanations: QuizWrongExplanation[];
  tags: string[];
}

export interface QuizQuestionFile {
  version: number;
  category: string;
  categoryGroup: string;
  description?: string;
  questions: QuizQuestion[];
}

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

export interface ValidationError {
  file?: string;
  questionId?: string;
  field?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  questionCount: number;
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/**
 * Validate a single question object. Returns a list of error messages.
 */
export function validateQuestion(
  q: unknown,
  fileCategory: string,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof q !== "object" || q === null) {
    return [{ message: "Question is not an object" }];
  }

  const question = q as Record<string, unknown>;
  const id =
    typeof question["id"] === "string" ? question["id"] : "(unknown id)";

  const ctx = (field: string, message: string): ValidationError => ({
    questionId: id,
    field,
    message: `[${fileCategory} / ${id}] ${field}: ${message}`,
  });

  // id
  if (!isNonEmptyString(question["id"])) {
    errors.push(ctx("id", "must be a non-empty string"));
  }

  // sourceType
  if (
    !isNonEmptyString(question["sourceType"]) ||
    !(ALLOWED_SOURCE_TYPES as readonly string[]).includes(
      question["sourceType"] as string,
    )
  ) {
    errors.push(
      ctx(
        "sourceType",
        `must be one of: ${ALLOWED_SOURCE_TYPES.join(", ")}`,
      ),
    );
  }

  // questionType
  if (
    !isNonEmptyString(question["questionType"]) ||
    !(ALLOWED_QUESTION_TYPES as readonly string[]).includes(
      question["questionType"] as string,
    )
  ) {
    errors.push(
      ctx(
        "questionType",
        `must be one of: ${ALLOWED_QUESTION_TYPES.join(", ")}`,
      ),
    );
  }

  // difficulty
  if (
    !isNonEmptyString(question["difficulty"]) ||
    !(ALLOWED_DIFFICULTY as readonly string[]).includes(
      question["difficulty"] as string,
    )
  ) {
    errors.push(
      ctx(
        "difficulty",
        `must be one of: ${ALLOWED_DIFFICULTY.join(", ")}`,
      ),
    );
  }

  // question text
  if (!isNonEmptyString(question["question"])) {
    errors.push(ctx("question", "must be a non-empty string"));
  }

  // choices — exactly 4, each with id and non-empty text
  const choices = question["choices"];
  if (!Array.isArray(choices) || choices.length !== 4) {
    errors.push(ctx("choices", "must be an array of exactly 4 items"));
  } else {
    choices.forEach((c: unknown, i: number) => {
      if (
        typeof c !== "object" ||
        c === null ||
        !isNonEmptyString((c as Record<string, unknown>)["id"]) ||
        !isNonEmptyString((c as Record<string, unknown>)["text"])
      ) {
        errors.push(
          ctx("choices", `item[${i}] must have non-empty 'id' and 'text'`),
        );
      }
    });
  }

  // correctChoiceId must match one of the choices
  const correctChoiceId = question["correctChoiceId"];
  if (!isNonEmptyString(correctChoiceId)) {
    errors.push(ctx("correctChoiceId", "must be a non-empty string"));
  } else if (Array.isArray(choices) && choices.length === 4) {
    const choiceIds = (choices as Record<string, unknown>[]).map(
      (c) => c["id"],
    );
    if (!choiceIds.includes(correctChoiceId)) {
      errors.push(
        ctx(
          "correctChoiceId",
          `"${correctChoiceId}" does not match any choice id (${choiceIds.join(", ")})`,
        ),
      );
    }
  }

  // correctExplanation
  if (!isNonEmptyString(question["correctExplanation"])) {
    errors.push(ctx("correctExplanation", "must be a non-empty string"));
  }

  // wrongExplanations — must cover all non-correct choice ids
  const wrongExplanations = question["wrongExplanations"];
  if (!Array.isArray(wrongExplanations)) {
    errors.push(ctx("wrongExplanations", "must be an array"));
  } else {
    // Check each entry has choiceId and explanation
    wrongExplanations.forEach((w: unknown, i: number) => {
      if (
        typeof w !== "object" ||
        w === null ||
        !isNonEmptyString((w as Record<string, unknown>)["choiceId"]) ||
        !isNonEmptyString((w as Record<string, unknown>)["explanation"])
      ) {
        errors.push(
          ctx(
            "wrongExplanations",
            `item[${i}] must have non-empty 'choiceId' and 'explanation'`,
          ),
        );
      }
    });

    // Check coverage: every non-correct choice must have a wrongExplanation
    if (
      Array.isArray(choices) &&
      choices.length === 4 &&
      isNonEmptyString(correctChoiceId)
    ) {
      const wrongChoiceIds = (choices as Record<string, unknown>[])
        .map((c) => c["id"] as string)
        .filter((id) => id !== correctChoiceId);

      const coveredIds = wrongExplanations
        .filter(
          (w) =>
            typeof w === "object" &&
            w !== null &&
            isNonEmptyString((w as Record<string, unknown>)["choiceId"]),
        )
        .map((w) => (w as Record<string, unknown>)["choiceId"] as string);

      wrongChoiceIds.forEach((wrongId) => {
        if (!coveredIds.includes(wrongId)) {
          errors.push(
            ctx(
              "wrongExplanations",
              `missing explanation for wrong choice id "${wrongId}"`,
            ),
          );
        }
      });
    }
  }

  // tags
  if (!isStringArray(question["tags"])) {
    errors.push(ctx("tags", "must be an array of strings"));
  }

  return errors;
}

/**
 * Validate a parsed quiz question file object.
 */
export function validateQuizFile(
  data: unknown,
  fileName: string,
): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof data !== "object" || data === null) {
    return {
      valid: false,
      errors: [{ file: fileName, message: "File content is not an object" }],
      questionCount: 0,
    };
  }

  const file = data as Record<string, unknown>;

  // version
  if (typeof file["version"] !== "number") {
    errors.push({ file: fileName, field: "version", message: "must be a number" });
  }

  // category
  if (!isNonEmptyString(file["category"])) {
    errors.push({ file: fileName, field: "category", message: "must be a non-empty string" });
  }

  // categoryGroup
  if (!isNonEmptyString(file["categoryGroup"])) {
    errors.push({ file: fileName, field: "categoryGroup", message: "must be a non-empty string" });
  }

  // questions array
  if (!Array.isArray(file["questions"])) {
    errors.push({ file: fileName, field: "questions", message: "must be an array" });
    return { valid: false, errors, questionCount: 0 };
  }

  const fileCategory =
    isNonEmptyString(file["category"]) ? (file["category"] as string) : fileName;

  // Check unique ids across all questions in this file
  const seenIds = new Set<string>();
  (file["questions"] as unknown[]).forEach((q: unknown) => {
    if (typeof q === "object" && q !== null && isNonEmptyString((q as Record<string, unknown>)["id"])) {
      const qId = (q as Record<string, unknown>)["id"] as string;
      if (seenIds.has(qId)) {
        errors.push({
          file: fileName,
          questionId: qId,
          field: "id",
          message: `[${fileCategory} / ${qId}] id: duplicate question id "${qId}"`,
        });
      }
      seenIds.add(qId);
    }
  });

  // Validate each question
  (file["questions"] as unknown[]).forEach((q: unknown) => {
    const qErrors = validateQuestion(q, fileCategory);
    errors.push(...qErrors.map((e) => ({ ...e, file: fileName })));
  });

  return {
    valid: errors.length === 0,
    errors,
    questionCount: (file["questions"] as unknown[]).length,
  };
}

/**
 * Validate multiple parsed quiz files. Returns a combined result.
 */
export function validateAllQuizFiles(
  files: { fileName: string; data: unknown }[],
): ValidationResult {
  const allErrors: ValidationError[] = [];
  let totalQuestions = 0;

  // Check cross-file unique ids
  const globalIdMap = new Map<string, string>(); // id → fileName

  files.forEach(({ fileName, data }) => {
    const result = validateQuizFile(data, fileName);
    allErrors.push(...result.errors);
    totalQuestions += result.questionCount;

    if (
      typeof data === "object" &&
      data !== null &&
      Array.isArray((data as Record<string, unknown>)["questions"])
    ) {
      ((data as Record<string, unknown>)["questions"] as unknown[]).forEach(
        (q: unknown) => {
          if (
            typeof q === "object" &&
            q !== null &&
            isNonEmptyString((q as Record<string, unknown>)["id"])
          ) {
            const qId = (q as Record<string, unknown>)["id"] as string;
            if (globalIdMap.has(qId)) {
              allErrors.push({
                file: fileName,
                questionId: qId,
                field: "id",
                message: `[${fileName} / ${qId}] id: duplicate id across files — also in "${globalIdMap.get(qId)}"`,
              });
            } else {
              globalIdMap.set(qId, fileName);
            }
          }
        },
      );
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    questionCount: totalQuestions,
  };
}
