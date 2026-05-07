"use client";

import type { ReactNode } from "react";
import {
  ClipboardList,
  Briefcase,
  FileInput,
  BadgeCheck,
} from "lucide-react";
import SummarySection from "@/components/SummarySection";

type FilterStatus =
  | "all"
  | "applying"
  | "postApplying"
  | "resume"
  | "interview1"
  | "interview2"
  | "interview3";

type Props = {
  /** Active jobs still in the pipeline (not offer/rejected). */
  pipelineTotal: number;
  /** Jobs in the applying stage. */
  applyingCount: number;
  /** Pipeline jobs past the applying stage (resume + interviews). */
  appliedCount: number;
  setFilterStatus: (s: FilterStatus) => void;
  embedded?: boolean;
  /** Shown below summary cards when embedded (e.g. Progress + desktop Find Jobs CTA). */
  embeddedExtras?: ReactNode;
};

const OverviewSection: React.FC<Props> = ({
  pipelineTotal,
  applyingCount,
  appliedCount,
  setFilterStatus,
  embedded = false,
  embeddedExtras,
}) => {
  const overviewCards = [
    {
      title: "Total",
      shortTitle: "Total",
      value: pipelineTotal,
      color:
        "bg-indigo-100 border border-indigo-300 dark:bg-indigo-900/80 dark:border-indigo-500",
      textColor: "text-indigo-800 dark:text-indigo-100",
      icon: <Briefcase size={20} />,
      onClick: () => setFilterStatus("all"),
    },
    {
      title: "Applying",
      shortTitle: "Applying",
      value: applyingCount,
      color:
        "bg-amber-50 border border-amber-300 dark:bg-amber-950/40 dark:border-amber-700",
      textColor: "text-amber-900 dark:text-amber-100",
      icon: <FileInput size={20} />,
      onClick: () => setFilterStatus("applying"),
    },
    {
      title: "Applied",
      shortTitle: "Applied",
      value: appliedCount,
      color:
        "bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700",
      textColor: "text-emerald-900 dark:text-emerald-100",
      icon: <BadgeCheck size={20} />,
      onClick: () => setFilterStatus("postApplying"),
    },
  ];

  if (embedded) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide">
          Application Overview
        </h3>
        <SummarySection
          cards={overviewCards}
          grid="grid-cols-3 gap-1 sm:gap-2"
          className="mb-0"
          cardVariant="compact"
        />
        {embeddedExtras}
      </div>
    );
  }

  return (
    <section className="mb-4 border border-gray-400 dark:border-slate-200 rounded-lg bg-white dark:bg-slate-700 shadow-sm p-4">
      <h2 className="flex items-center gap-2 font-bold text-xl text-gray-700 dark:text-gray-200 mb-4">
        <ClipboardList size={24} aria-hidden="true" />
        Application Overview
      </h2>
      <SummarySection
        cards={overviewCards}
        grid="grid-cols-3 gap-1.5 sm:gap-3"
        className="mb-0"
        cardVariant="compact"
      />
    </section>
  );
};

export default OverviewSection;
