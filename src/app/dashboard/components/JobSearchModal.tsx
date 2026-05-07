"use client";

import { motion } from "framer-motion";
import {
  X,
  Linkedin,
  Search,
  Briefcase,
  Globe,
  Building2,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";

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

function MapleLeafIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label="Maple leaf"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M383.8 351.7c2.5-2.5 105.2-92.4 105.2-92.4l-17.5-7.5c-10-4.9-7.4-11.5-5-17.4 2.4-7.6 20.1-67.3 20.1-67.3s-47.7 10-57.7 12.5c-7.5 2.4-10-2.5-12.5-7.5s-15-32.4-15-32.4-52.6 59.9-55.1 62.3c-10 7.5-20.1 0-17.6-10 0-10 27.6-129.6 27.6-129.6s-30.1 17.4-40.1 22.4c-7.5 5-12.6 5-17.6-5C293.5 72.3 255.9 0 255.9 0s-37.5 72.3-42.5 79.8c-5 10-10 10-17.6 5-10-5-40.1-22.4-40.1-22.4S183.3 182 183.3 192c2.5 10-7.5 17.5-17.6 10-2.5-2.5-55.1-62.3-55.1-62.3S98.1 167 95.6 172s-5 9.9-12.5 7.5C73 177 25.4 167 25.4 167s17.6 59.7 20.1 67.3c2.4 6 5 12.5-5 17.4L23 259.3s102.6 89.9 105.2 92.4c5.1 5 10 7.5 5.1 22.5-5.1 15-10.1 35.1-10.1 35.1s95.2-20.1 105.3-22.6c8.7-.9 18.3 2.5 18.3 12.5S241 512 241 512h30s-5.8-102.7-5.8-112.8 9.5-13.4 18.4-12.5c10 2.5 105.2 22.6 105.2 22.6s-5-20.1-10-35.1 0-17.5 5-22.5z"
      />
    </svg>
  );
}

const GOJOBS_SITE = {
  name: "GoJobs",
  description: "Job searching with AI-powered verification and smart matching your profile.",
  url: "https://gojobs.app",
  icon: <Briefcase size={24} aria-hidden />,
  iconBg: "bg-green-600 dark:bg-green-500",
} as const;

const OTHER_JOB_SITES = [
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
          className="p-4 pt-2"
          variants={optionList}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={optionItem} className="rounded-2xl border border-green-200 bg-green-50/70 p-3 dark:border-green-800 dark:bg-green-950/30">
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-green-700 dark:bg-green-900/60 dark:text-green-300">
                RECOMMENDED
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white shadow-sm">
                <Sparkles size={16} aria-hidden />
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSelect(GOJOBS_SITE.url)}
              className="w-full rounded-xl border border-green-200 bg-white p-4 text-left transition-colors hover:border-green-300 dark:border-green-800 dark:bg-slate-900 dark:hover:border-green-700"
            >
              <div className="flex items-start gap-4">
                <span
                  className={`mt-0.5 flex-shrink-0 rounded-lg p-2 ${GOJOBS_SITE.iconBg} text-white`}
                >
                  {GOJOBS_SITE.icon}
                </span>
                <span className="min-w-0">
                  {/* <span className="mb-1 block text-3xl leading-none">🇨🇦</span> */}
                  <span className="inline-flex items-center gap-1.5 font-semibold text-lg text-slate-900 dark:text-slate-100">
                    {GOJOBS_SITE.name}
                    <MapleLeafIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </span>
                  <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">
                    {GOJOBS_SITE.description}
                  </span>
                </span>
              </div>

              {/* <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/55 dark:text-green-300">
                  <CheckCircle2 size={12} aria-hidden />
                  Local Opportunities
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/55 dark:text-green-300">
                  <ShieldCheck size={12} aria-hidden />
                  Student Friendly
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/55 dark:text-green-300">
                  <BadgeCheck size={12} aria-hidden />
                  Verified Employers
                </span>
              </div> */}

              <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">
                Search on GoJobs
                <ArrowRight size={16} aria-hidden />
              </span>
            </button>
          </motion.div>

          <motion.div variants={optionItem} className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
              OTHER JOB BOARDS
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </motion.div>

          <div className="flex flex-col gap-3">
            {OTHER_JOB_SITES.map((site) => (
            <motion.button
              key={site.name}
              type="button"
              variants={optionItem}
              onClick={() => handleSelect(site.url)}
              className={`flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-colors active:scale-[0.99] ${site.border} ${site.bg} ${site.hoverBorder}`}
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
              <span className="ml-auto pt-1 text-slate-400 dark:text-slate-500">
                <ChevronRight size={22} aria-hidden />
              </span>
            </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
