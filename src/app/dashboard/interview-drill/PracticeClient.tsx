"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import type {
  PracticeItem,
  PracticeSessionResponse,
  QuizChoice,
  SubmittedAnswer,
} from "@/lib/quiz/quizClientTypes";
import QuizProgressBar from "./components/QuizProgressBar";
import QuizChoiceButton from "./components/QuizChoiceButton";
import QuizFeedback from "./components/QuizFeedback";
import QuizCompleteScreen from "./components/QuizCompleteScreen";

const CHOICE_LABELS = ["A", "B", "C", "D"];

type Props = {
  userName: string | null;
};

type UiPhase = "loading" | "error" | "question" | "feedback" | "complete";

export default function PracticeClient({ userName }: Props) {
  const [phase, setPhase] = useState<UiPhase>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState<SubmittedAnswer | null>(null);
  const [showReview, setShowReview] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setPhase("loading");
    setCurrentIndex(0);
    setCompletedCount(0);
    setCorrectCount(0);
    setSelectedChoiceId(null);
    setSubmittedAnswer(null);
    setShowReview(false);

    try {
      const res = await fetch("/api/quiz/practice");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Failed to load practice questions.");
      }
      const data = (await res.json()) as PracticeSessionResponse;
      setItems(data.questions);
      setPhase("question");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSubmit = useCallback(() => {
    if (!selectedChoiceId || phase !== "question") return;

    const item = items[currentIndex];
    if (!item) return;

    const isCorrect = selectedChoiceId === item.correctChoiceId;

    setSubmittedAnswer({
      itemId: `practice-${currentIndex}`,
      selectedChoiceId,
      isCorrect,
      correctChoiceId: item.correctChoiceId,
      correctIndex: item.correctIndex,
      correctExplanation: item.correctExplanation,
      wrongExplanations: item.wrongExplanations,
    });

    setCompletedCount((c) => c + 1);
    if (isCorrect) setCorrectCount((c) => c + 1);
    setPhase("feedback");
  }, [selectedChoiceId, phase, items, currentIndex]);

  const handleNext = useCallback(() => {
    setSelectedChoiceId(null);
    setSubmittedAnswer(null);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      setPhase("complete");
    } else {
      setCurrentIndex(nextIndex);
      setPhase("question");
    }
  }, [currentIndex, items.length]);

  function getChoiceState(choiceId: string): "idle" | "selected" | "correct" | "wrong" | "disabled" {
    if (phase === "question") {
      return selectedChoiceId === choiceId ? "selected" : "idle";
    }
    if (phase === "feedback" && submittedAnswer) {
      if (choiceId === submittedAnswer.correctChoiceId) return "correct";
      if (choiceId === submittedAnswer.selectedChoiceId) return "wrong";
      return "disabled";
    }
    return "idle";
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------
  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error
  // ---------------------------------------------------------------------------
  if (phase === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <p className="text-slate-600 dark:text-slate-400">{errorMessage}</p>
          <button
            onClick={fetchQuestions}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Try again
          </button>
          <div>
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-indigo-500 transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const choices: QuizChoice[] = currentItem?.choices ?? [];
  const totalQuestions = items.length;

  // ---------------------------------------------------------------------------
  // Complete
  // ---------------------------------------------------------------------------
  if (phase === "complete") {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-indigo-500 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>

        <QuizCompleteScreen
          correctCount={correctCount}
          totalQuestions={totalQuestions}
          onReview={() => setShowReview((v) => !v)}
          showReview={showReview}
          mode="practice"
          onRetry={fetchQuestions}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Question / Feedback
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-indigo-500 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Practice Mode
          </h1>
          {userName && (
            <span className="text-xs text-slate-400 dark:text-slate-500">{userName}</span>
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Question {currentIndex + 1} of {totalQuestions}
        </p>
      </div>

      <QuizProgressBar
        completedQuestions={completedCount}
        totalQuestions={totalQuestions}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={`practice-${currentIndex}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="space-y-5"
        >
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
              {currentItem?.question}
            </p>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Choose the best answer
            </p>
          </div>

          <div className="space-y-2.5" role="radiogroup" aria-label="Answer choices">
            {choices.map((choice, i) => (
              <QuizChoiceButton
                key={choice.id}
                id={choice.id}
                text={choice.text}
                label={CHOICE_LABELS[i] ?? choice.id.toUpperCase()}
                state={getChoiceState(choice.id)}
                onClick={() => {
                  if (phase === "question") setSelectedChoiceId(choice.id);
                }}
              />
            ))}
          </div>

          {phase === "feedback" && submittedAnswer && (
            <QuizFeedback
              isCorrect={submittedAnswer.isCorrect}
              selectedChoiceId={submittedAnswer.selectedChoiceId}
              correctChoiceId={submittedAnswer.correctChoiceId}
              correctExplanation={submittedAnswer.correctExplanation}
              wrongExplanations={submittedAnswer.wrongExplanations}
            />
          )}

          <div className="pt-1">
            {phase === "question" && (
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedChoiceId}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.1 }}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3.5 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Submit
              </motion.button>
            )}

            {phase === "feedback" && (
              <motion.button
                type="button"
                onClick={handleNext}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.2 }}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-3.5 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {currentIndex < totalQuestions - 1 ? "Next" : "Finish"}
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
