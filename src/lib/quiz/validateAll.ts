/**
 * One-off script to validate all data/quiz/*.json files and print results.
 * Run: npx tsx src/lib/quiz/validateAll.ts
 */
import * as fs from "fs";
import * as path from "path";
import { validateAllQuizFiles } from "./validation";

const QUIZ_DATA_DIR = path.resolve(process.cwd(), "data/quiz");
const QUESTION_FILE_PATTERN = /^.+-questions\.json$/;

const files = fs
  .readdirSync(QUIZ_DATA_DIR)
  .filter((f) => QUESTION_FILE_PATTERN.test(f))
  .map((fileName) => {
    const raw = fs.readFileSync(path.join(QUIZ_DATA_DIR, fileName), "utf-8");
    return { fileName, data: JSON.parse(raw) };
  });

const result = validateAllQuizFiles(files);

if (result.valid) {
  console.log(
    `✅ All ${files.length} files valid — ${result.questionCount} questions total`,
  );
} else {
  console.error(`❌ Validation errors:\n`);
  result.errors.forEach((e) => console.error(`  ${e.message}`));
  process.exit(1);
}
