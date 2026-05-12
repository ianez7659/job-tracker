"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

type ChoiceState = "idle" | "selected" | "correct" | "wrong" | "disabled";

type Props = {
  id: string;
  text: string;
  state: ChoiceState;
  onClick: () => void;
  label: string; // "A" | "B" | "C" | "D"
};

const stateClasses: Record<ChoiceState, string> = {
  idle: "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500 dark:hover:bg-slate-700 cursor-pointer",
  selected: "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950 cursor-pointer",
  correct: "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950",
  wrong: "border-rose-400 bg-rose-50 dark:border-rose-500 dark:bg-rose-950",
  disabled: "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-800",
};

const labelClasses: Record<ChoiceState, string> = {
  idle: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  selected: "bg-indigo-500 text-white dark:bg-indigo-400",
  correct: "bg-emerald-500 text-white dark:bg-emerald-400",
  wrong: "bg-rose-400 text-white dark:bg-rose-500",
  disabled: "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500",
};

export default function QuizChoiceButton({ id, text, state, onClick, label }: Props) {
  const isClickable = state === "idle" || state === "selected";

  return (
    <motion.button
      key={id}
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      whileTap={isClickable ? { scale: 0.97 } : {}}
      transition={{ duration: 0.1 }}
      className={[
        "w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        stateClasses[state],
      ].join(" ")}
      aria-pressed={state === "selected" || state === "correct" || state === "wrong"}
    >
      <span
        className={[
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-150",
          labelClasses[state],
        ].join(" ")}
      >
        {state === "correct" ? (
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        ) : state === "wrong" ? (
          <X className="h-3.5 w-3.5" strokeWidth={3} />
        ) : (
          label
        )}
      </span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
        {text}
      </span>
    </motion.button>
  );
}
