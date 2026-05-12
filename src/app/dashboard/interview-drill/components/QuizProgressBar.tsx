"use client";

import { motion } from "framer-motion";

type Props = {
  completedQuestions: number;
  totalQuestions: number;
};

export default function QuizProgressBar({ completedQuestions, totalQuestions }: Props) {
  const percent =
    totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

  return (
    <div className="w-full" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Quiz progress: ${completedQuestions} of ${totalQuestions} questions completed`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Progress
        </span>
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          {completedQuestions}/{totalQuestions}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
