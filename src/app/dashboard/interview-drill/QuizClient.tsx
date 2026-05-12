"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import type {
  QuizSessionResponse,
  QuizItem,
  QuizChoice,
  SubmittedAnswer,
} from "@/lib/quiz/quizClientTypes";
import { findFirstUnansweredIndex, isSessionComplete } from "@/lib/quiz/quizHelpers";
import QuizProgressBar from "./components/QuizProgressBar";
import QuizChoiceButton from "./components/QuizChoiceButton";
import QuizFeedback from "./components/QuizFeedback";
import QuizCompleteScreen from "./components/QuizCompleteScreen";

const CHOICE_LABELS = ["A", "B", "C", "D"];

type Props = {
  userName: string | null;
};

type UiPhase = "loading" | "error" | "question" | "feedback" | "complete";

export default function QuizClient({ userName }: Props) {
  const [phase, setPhase] = useState<UiPhase>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<QuizSessionResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState<SubmittedAnswer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch session on mount
  // ---------------------------------------------------------------------------
  const fetchSession = useCallback(async () => {
    setPhase("loading");
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/quiz/session?timeZone=${encodeURIComponent(timeZone)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Failed to load quiz session.");
      }
      const data = (await res.json()) as QuizSessionResponse;
      setSessionData(data);

      // Determine starting phase
      if (isSessionComplete(data.session.status)) {
        setPhase("complete");
      } else {
        const firstUnanswered = findFirstUnansweredIndex(data.items);
        if (firstUnanswered === -1) {
          setPhase("complete");
        } else {
          setCurrentIndex(firstUnanswered);
          setPhase("question");
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // ---------------------------------------------------------------------------
  // Answer submission
  // ---------------------------------------------------------------------------
  const handleSubmit = useCallback(async () => {
    if (!sessionData || !selectedChoiceId || isSubmitting) return;

    const item = sessionData.items[currentIndex];
    if (!item || item.answered) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/quiz/session/${sessionData.session.id}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id, answerChoiceId: selectedChoiceId }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Failed to submit answer.");
      }

      const result = await res.json() as {
        isCorrect: boolean;
        correctChoiceId: string;
        correctIndex: number;
        correctExplanation: string;
        wrongExplanations: { choiceId: string; explanation: string }[];
      };

      setSubmittedAnswer({
        itemId: item.id,
        selectedChoiceId,
        isCorrect: result.isCorrect,
        correctChoiceId: result.correctChoiceId,
        correctIndex: result.correctIndex,
        correctExplanation: result.correctExplanation,
        wrongExplanations: result.wrongExplanations,
      });

      // Update local session data: mark item as answered
      setSessionData((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.map((i) => {
          if (i.id !== item.id) return i;
          return {
            ...i,
            answered: true as const,
            userAnswerChoiceId: selectedChoiceId,
            isCorrect: result.isCorrect,
            answeredAt: new Date().toISOString(),
            correctChoiceIdSnapshot: result.correctChoiceId,
            correctIndexSnapshot: result.correctIndex,
            correctExplanationSnapshot: result.correctExplanation,
            wrongExplanationsSnapshot: result.wrongExplanations,
          };
        });
        const newCompleted = prev.session.completedQuestions + 1;
        const isNowComplete = newCompleted >= prev.session.totalQuestions;
        return {
          session: {
            ...prev.session,
            completedQuestions: newCompleted,
            status: isNowComplete ? "completed" : "in_progress",
          },
          items: updatedItems,
        };
      });

      setPhase("feedback");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to submit.");
      setPhase("error");
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionData, selectedChoiceId, isSubmitting, currentIndex]);

  // ---------------------------------------------------------------------------
  // Next question
  // ---------------------------------------------------------------------------
  const handleNext = useCallback(() => {
    if (!sessionData) return;

    const nextUnanswered = sessionData.items.findIndex(
      (item, idx) => idx > currentIndex && !item.answered,
    );

    setSelectedChoiceId(null);
    setSubmittedAnswer(null);

    if (nextUnanswered === -1) {
      setPhase("complete");
    } else {
      setCurrentIndex(nextUnanswered);
      setPhase("question");
    }
  }, [sessionData, currentIndex]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const currentItem: QuizItem | undefined = sessionData?.items[currentIndex];
  const choices: QuizChoice[] = currentItem
    ? (currentItem.choicesSnapshot as QuizChoice[])
    : [];

  function getChoiceState(choiceId: string): "idle" | "selected" | "correct" | "wrong" | "disabled" {
    if (phase === "question") {
      if (selectedChoiceId === choiceId) return "selected";
      return "idle";
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
            onClick={fetchSession}
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

  const session = sessionData!.session;
  const items = sessionData!.items;
  const displayIndex = currentIndex + 1;
  const totalQuestions = session.totalQuestions;

  // ---------------------------------------------------------------------------
  // Completed
  // ---------------------------------------------------------------------------
  if (phase === "complete") {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-indigo-500 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>

        <QuizCompleteScreen
          items={items}
          totalQuestions={totalQuestions}
          onReview={() => setShowReview((v) => !v)}
          showReview={showReview}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Question / Feedback
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-indigo-500 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Daily Interview Drill
          </h1>
          {userName && (
            <span className="text-xs text-slate-400 dark:text-slate-500">{userName}</span>
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Question {displayIndex} of {totalQuestions}
        </p>
      </div>

      {/* Progress bar */}
      <QuizProgressBar
        completedQuestions={session.completedQuestions}
        totalQuestions={totalQuestions}
      />

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`question-${currentIndex}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="space-y-5"
        >
          {/* Question text */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
              {currentItem?.renderedQuestionSnapshot}
            </p>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Choose the best answer
            </p>
          </div>

          {/* Choices */}
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

          {/* Feedback */}
          {phase === "feedback" && submittedAnswer && (
            <QuizFeedback
              isCorrect={submittedAnswer.isCorrect}
              selectedChoiceId={submittedAnswer.selectedChoiceId}
              correctChoiceId={submittedAnswer.correctChoiceId}
              correctExplanation={submittedAnswer.correctExplanation}
              wrongExplanations={submittedAnswer.wrongExplanations}
            />
          )}

          {/* Action button */}
          <div className="pt-1">
            {phase === "question" && (
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedChoiceId || isSubmitting}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.1 }}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3.5 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  "Submit"
                )}
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
