"use client";

import { motion } from "framer-motion";
import { X, FileText, CreditCard } from "lucide-react";

type Props = {
  onClose: () => void;
  onSelectStandard: () => void;
  onSelectSimple: () => void;
};

/**
 * First step when adding a job: pick standard (full) form vs simple (mobile / card) flow.
 */
const backdropTransition = { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const };
const panelTransition = {
  type: "spring" as const,
  damping: 26,
  stiffness: 320,
  mass: 0.85,
};

const optionList = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.14 },
  },
};

const optionItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 22, stiffness: 380 },
  },
};

export default function NewJobModePicker({
  onClose,
  onSelectStandard,
  onSelectSimple,
}: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-job-mode-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={backdropTransition}
      onClick={onClose}
    >
      <motion.div
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 dark:border-slate-600 max-h-[90vh] overflow-y-auto"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={panelTransition}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-600">
          <h2
            id="new-job-mode-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Add a job
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>
        <p className="px-4 pt-3 pb-2 text-sm text-slate-600 dark:text-slate-400">
          Choose how you want to add this application.
        </p>
        <motion.div
          className="p-4 pt-2 flex flex-col gap-3"
          variants={optionList}
          initial="hidden"
          animate="visible"
        >
          <motion.button
            type="button"
            variants={optionItem}
            onClick={onSelectStandard}
            className="flex items-start gap-4 w-full text-left p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors min-h-[5rem] active:scale-[0.99]"
          >
            <span className="flex-shrink-0 mt-0.5 p-2 rounded-lg bg-indigo-600 text-white dark:bg-indigo-500">
              <FileText size={24} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900 dark:text-slate-100">
                Standard
              </span>
              <span className="block text-sm text-slate-600 dark:text-slate-400 mt-1">
                Full form — URL, JD, tags, and all fields (same as before).
              </span>
            </span>
          </motion.button>
          <motion.button
            type="button"
            variants={optionItem}
            onClick={onSelectSimple}
            className="flex items-start gap-4 w-full text-left p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-amber-400 dark:hover:border-amber-600 transition-colors min-h-[5rem] active:scale-[0.99]"
          >
            <span className="flex-shrink-0 mt-0.5 p-2 rounded-lg bg-amber-500 text-white dark:bg-amber-600">
              <CreditCard size={24} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900 dark:text-slate-100">
                Simple (mobile)
              </span>
              <span className="block text-sm text-slate-600 dark:text-slate-400 mt-1">
                Scan a business card — camera and AI extraction (opening next).
              </span>
            </span>
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
