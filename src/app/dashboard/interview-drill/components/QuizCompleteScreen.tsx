"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Trophy, RotateCcw, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { QuizItem } from "@/lib/quiz/quizClientTypes";
import { computeCorrectCount } from "@/lib/quiz/quizHelpers";
import QuizReviewItem from "./QuizReviewItem";

type Props = {
  /** Daily mode: pass items and derive correctCount internally. */
  items?: QuizItem[];
  /** Practice mode: pass correctCount directly (no items to review). */
  correctCount?: number;
  totalQuestions: number;
  onReview: () => void;
  showReview: boolean;
  mode?: "daily" | "practice";
  onRetry?: () => void;
};

export default function QuizCompleteScreen({
  items,
  correctCount: correctCountProp,
  totalQuestions,
  onReview,
  showReview,
  mode = "daily",
  onRetry,
}: Props) {
  const correctCount = mode === "practice"
    ? (correctCountProp ?? 0)
    : computeCorrectCount(items ?? []);
  const percent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const scoreLabel =
    percent === 100
      ? "Perfect!"
      : percent >= 80
        ? "Great job!"
        : percent >= 60
          ? "Good effort!"
          : "Keep practicing!";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Completion badge */}
      <div className="flex flex-col items-center gap-3 py-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }}
        >
          {percent === 100 ? (
            <Trophy className="h-14 w-14 text-amber-400" />
          ) : (
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          )}
        </motion.div>
        <div className="text-center space-y-1">
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{scoreLabel}</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {mode === "practice" ? "Practice session complete" : "Daily Interview Drill completed"}
          </p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950 px-6 py-2 border border-indigo-100 dark:border-indigo-900">
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {correctCount}/{totalQuestions}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">correct</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {mode === "practice" && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-3.5 text-sm font-semibold text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try another set
          </button>
        )}

        {mode === "daily" && (
          <button
            type="button"
            onClick={onReview}
            className="w-full flex items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-slate-400" />
              {showReview ? "Hide review" : "Review answers"}
            </span>
            <ChevronRight className={["h-4 w-4 text-slate-400 transition-transform", showReview ? "rotate-90" : ""].join(" ")} />
          </button>
        )}

        <Link
          href="/dashboard"
          className="flex items-center justify-center w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Review section — daily only */}
      {mode === "daily" && showReview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 pt-2"
        >
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            Review Answers
          </h3>
          {(items ?? []).map((item, idx) => (
            <QuizReviewItem key={item.id} item={item} index={idx} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
