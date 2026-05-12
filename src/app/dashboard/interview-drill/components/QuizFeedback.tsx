"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import type { WrongExplanation } from "@/lib/quiz/quizClientTypes";
import { findWrongExplanation } from "@/lib/quiz/quizHelpers";

type Props = {
  isCorrect: boolean;
  selectedChoiceId: string;
  correctChoiceId: string;
  correctExplanation: string;
  wrongExplanations: WrongExplanation[];
};

export default function QuizFeedback({
  isCorrect,
  selectedChoiceId,
  correctChoiceId,
  correctExplanation,
  wrongExplanations,
}: Props) {
  const wrongExplanation =
    !isCorrect ? findWrongExplanation(wrongExplanations, selectedChoiceId) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={[
        "rounded-xl border-2 p-4 space-y-3",
        isCorrect
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
          : "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40",
      ].join(" ")}
    >
      {/* Result header */}
      <div className="flex items-center gap-2">
        {isCorrect ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0 text-rose-500 dark:text-rose-400" />
        )}
        <p className={[
          "font-semibold text-sm",
          isCorrect
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-rose-600 dark:text-rose-400",
        ].join(" ")}>
          {isCorrect ? "Correct!" : "Not quite"}
        </p>
      </div>

      {/* Wrong choice explanation (if wrong) */}
      {!isCorrect && wrongExplanation && (
        <p className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed">
          {wrongExplanation}
        </p>
      )}

      {/* Correct explanation */}
      <div className="flex gap-2">
        <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-500 dark:text-amber-400" />
        <div className="space-y-1">
          {!isCorrect && (
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Correct answer: {correctChoiceId.toUpperCase()}
            </p>
          )}
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {correctExplanation}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
