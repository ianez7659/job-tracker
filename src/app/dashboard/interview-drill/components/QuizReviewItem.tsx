"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { QuizItem, AnsweredItem } from "@/lib/quiz/quizClientTypes";
import { findWrongExplanation } from "@/lib/quiz/quizHelpers";

const CHOICE_LABELS: Record<string, string> = { a: "A", b: "B", c: "C", d: "D" };

type Props = {
  item: QuizItem;
  index: number;
};

export default function QuizReviewItem({ item, index }: Props) {
  // Unanswered items (shouldn't appear in review, but guard gracefully)
  if (!item.answered) {
    return null;
  }

  const answered = item as AnsweredItem;
  const wrongExplanation = !answered.isCorrect
    ? findWrongExplanation(answered.wrongExplanationsSnapshot, answered.userAnswerChoiceId)
    : undefined;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3">
      {/* Question header */}
      <div className="flex items-start gap-2">
        {answered.isCorrect ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
        ) : (
          <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
        )}
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Question {index + 1}</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
            {answered.renderedQuestionSnapshot}
          </p>
        </div>
      </div>

      {/* Choices */}
      <div className="space-y-1.5">
        {answered.choicesSnapshot.map((choice) => {
          const isCorrect = choice.id === answered.correctChoiceIdSnapshot;
          const isSelected = choice.id === answered.userAnswerChoiceId;
          const isWrongSelected = isSelected && !answered.isCorrect;

          return (
            <div
              key={choice.id}
              className={[
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                isCorrect
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : isWrongSelected
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                    : "text-slate-500 dark:text-slate-400",
              ].join(" ")}
            >
              <span className={[
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                isCorrect
                  ? "bg-emerald-500 text-white"
                  : isWrongSelected
                    ? "bg-rose-400 text-white"
                    : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400",
              ].join(" ")}>
                {CHOICE_LABELS[choice.id] ?? choice.id.toUpperCase()}
              </span>
              {choice.text}
            </div>
          );
        })}
      </div>

      {/* Wrong explanation */}
      {!answered.isCorrect && wrongExplanation && (
        <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed border-l-2 border-rose-300 dark:border-rose-700 pl-2">
          {wrongExplanation}
        </p>
      )}

      {/* Correct explanation */}
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-l-2 border-indigo-300 dark:border-indigo-700 pl-2">
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Explanation: </span>
        {answered.correctExplanationSnapshot}
      </p>
    </div>
  );
}
