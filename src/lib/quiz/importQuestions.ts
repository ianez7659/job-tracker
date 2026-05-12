/**
 * Import script: reads data/quiz/*.json files and upserts into the
 * QuizQuestion table via sourceId.
 *
 * Usage (from project root):
 *   npx tsx src/lib/quiz/importQuestions.ts             # dry-run
 *   npx tsx src/lib/quiz/importQuestions.ts --write     # actual upsert (requires DB)
 *
 * IMPORTANT: Do not run with --write without explicit user approval.
 *            Running --write mutates the database.
 */

import * as fs from "fs";
import * as path from "path";
import type { Prisma } from "@/generated/prisma";
import { validateAllQuizFiles, QuizQuestionFile } from "./validation";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const QUIZ_DATA_DIR = path.resolve(process.cwd(), "data/quiz");
const QUESTION_FILE_PATTERN = /^.+-questions\.json$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadQuizFiles(): { fileName: string; data: unknown }[] {
  const entries = fs.readdirSync(QUIZ_DATA_DIR).filter((f) =>
    QUESTION_FILE_PATTERN.test(f),
  );

  return entries.map((fileName) => {
    const filePath = path.join(QUIZ_DATA_DIR, fileName);
    const raw = fs.readFileSync(filePath, "utf-8");
    try {
      return { fileName, data: JSON.parse(raw) };
    } catch {
      return { fileName, data: null };
    }
  });
}

/** Normalize a QuizQuestion file record into a flat DB-ready object. */
function normalizeQuestion(
  q: QuizQuestionFile["questions"][number],
  file: QuizQuestionFile,
) {
  return {
    sourceId: q.id,
    sourceType: q.sourceType,
    categoryGroup: file.categoryGroup,
    category: file.category,
    questionType: q.questionType,
    difficulty: q.difficulty,
    question: q.question,
    choices: q.choices as unknown as Prisma.InputJsonValue,
    correctChoiceId: q.correctChoiceId,
    correctExplanation: q.correctExplanation,
    wrongExplanations: q.wrongExplanations as unknown as Prisma.InputJsonValue,
    tags: q.tags as unknown as Prisma.InputJsonValue,
    isActive: true,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const isDryRun = !process.argv.includes("--write");

  console.log(
    `\n🔍 Quiz import — ${isDryRun ? "DRY RUN (no DB changes)" : "⚠️  WRITE MODE"}\n`,
  );

  // 1. Load files
  const files = loadQuizFiles();
  console.log(`Found ${files.length} quiz file(s) in ${QUIZ_DATA_DIR}\n`);

  // 2. Validate
  const validationResult = validateAllQuizFiles(files);

  if (!validationResult.valid) {
    console.error("❌ Validation failed:\n");
    validationResult.errors.forEach((e) => {
      console.error(`  ${e.message}`);
    });
    console.error(
      `\nTotal errors: ${validationResult.errors.length}. Aborting import.\n`,
    );
    process.exit(1);
  }

  console.log(
    `✅ Validation passed — ${validationResult.questionCount} questions across ${files.length} files\n`,
  );

  // 3. Build normalized records
  const records: ReturnType<typeof normalizeQuestion>[] = [];

  for (const { data } of files) {
    const file = data as QuizQuestionFile;
    for (const q of file.questions) {
      records.push(normalizeQuestion(q, file));
    }
  }

  console.log(`📦 ${records.length} records ready for upsert\n`);

  if (isDryRun) {
    console.log(
      "ℹ️  Dry run — showing first 3 normalized records:\n",
    );
    records.slice(0, 3).forEach((r, i) => {
      console.log(`  [${i + 1}] sourceId=${r.sourceId}, category=${r.category}, difficulty=${r.difficulty}`);
    });
    console.log(
      "\n✅ Dry run complete. Run with --write to execute upsert.\n",
    );
    return;
  }

  // 4. Upsert (only when --write flag is passed)
  // Dynamic import to avoid Prisma client initialization in dry-run context
  const { prisma } = await import("../prisma");

  let upserted = 0;
  let errors = 0;

  for (const record of records) {
    try {
      await prisma.quizQuestion.upsert({
        where: { sourceId: record.sourceId },
        update: {
          sourceType: record.sourceType,
          categoryGroup: record.categoryGroup,
          category: record.category,
          questionType: record.questionType,
          difficulty: record.difficulty,
          question: record.question,
          choices: record.choices,
          correctChoiceId: record.correctChoiceId,
          correctExplanation: record.correctExplanation,
          wrongExplanations: record.wrongExplanations,
          tags: record.tags,
          isActive: record.isActive,
        },
        create: record,
      });
      upserted++;
    } catch (err) {
      console.error(`  ❌ Failed to upsert ${record.sourceId}:`, err);
      errors++;
    }
  }

  await prisma.$disconnect();

  console.log(`\n✅ Import complete — ${upserted} upserted, ${errors} errors\n`);
  if (errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
