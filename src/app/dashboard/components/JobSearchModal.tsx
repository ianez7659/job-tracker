"use client";

import { motion } from "framer-motion";
import { X, Linkedin, Search, Briefcase, Globe, Building2 } from "lucide-react";

type Props = {
  onClose: () => void;
};

const backdropTransition = {
  duration: 0.22,
  ease: [0.25, 0.1, 0.25, 1] as const,
};
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

const JOB_SITES = [
  {
    name: "LinkedIn",
    description: "Professional network — find jobs and connect with employers.",
    url: "https://www.linkedin.com/jobs",
    icon: <Linkedin size={24} aria-hidden />,
    iconBg: "bg-blue-600 dark:bg-blue-500",
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50/80 dark:bg-blue-950/40",
    hoverBorder: "hover:border-blue-400 dark:hover:border-blue-500",
  },
  {
    name: "Indeed",
    description: "One of the largest job boards — search millions of listings.",
    url: "https://ca.indeed.com",
    icon: <Search size={24} aria-hidden />,
    iconBg: "bg-indigo-600 dark:bg-indigo-500",
    border: "border-indigo-200 dark:border-indigo-800",
    bg: "bg-indigo-50/80 dark:bg-indigo-950/40",
    hoverBorder: "hover:border-indigo-400 dark:hover:border-indigo-500",
  },
  {
    name: "GoJobs",
    description: "Job searching with AI-powered verification and smart matching your profile.",
    url: "https://gojobs.app",
    icon: <Briefcase size={24} aria-hidden />,
    iconBg: "bg-green-600 dark:bg-green-500",
    border: "border-green-200 dark:border-green-800",
    bg: "bg-green-50/80 dark:bg-green-950/40",
    hoverBorder: "hover:border-green-400 dark:hover:border-green-500",
  },
  {
    name: "Glassdoor",
    description: "Jobs with company reviews, salaries, and interview insights.",
    url: "https://www.glassdoor.com/Job/index.htm",
    icon: <Building2 size={24} aria-hidden />,
    iconBg: "bg-emerald-600 dark:bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800",
    bg: "bg-emerald-50/80 dark:bg-emerald-950/40",
    hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-500",
  },
  {
    name: "Monster",
    description: "Global job search platform with career resources.",
    url: "https://www.monster.com",
    icon: <Globe size={24} aria-hidden />,
    iconBg: "bg-violet-600 dark:bg-violet-500",
    border: "border-violet-200 dark:border-violet-800",
    bg: "bg-violet-50/80 dark:bg-violet-950/40",
    hoverBorder: "hover:border-violet-400 dark:hover:border-violet-500",
  },
] as const;

export default function JobSearchModal({ onClose }: Props) {
  const handleSelect = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-search-modal-title"
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
            id="job-search-modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Find Jobs
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
          Choose a job board to start your search.
        </p>
        <motion.div
          className="p-4 pt-2 flex flex-col gap-3"
          variants={optionList}
          initial="hidden"
          animate="visible"
        >
          {JOB_SITES.map((site) => (
            <motion.button
              key={site.name}
              type="button"
              variants={optionItem}
              onClick={() => handleSelect(site.url)}
              className={`flex items-start gap-4 w-full text-left p-4 rounded-xl border-2 ${site.border} ${site.bg} ${site.hoverBorder} transition-colors min-h-[5rem] active:scale-[0.99]`}
            >
              <span
                className={`flex-shrink-0 mt-0.5 p-2 rounded-lg ${site.iconBg} text-white`}
              >
                {site.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-slate-900 dark:text-slate-100">
                  {site.name}
                </span>
                <span className="block text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {site.description}
                </span>
              </span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
