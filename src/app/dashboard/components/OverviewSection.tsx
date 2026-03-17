"use client";

import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Hourglass,
  CalendarDays,
  Archive,
  Briefcase,
} from "lucide-react";
import SummarySection from "@/components/SummarySection";

type FilterStatus =
  | "all"
  | "resume"
  | "interview1"
  | "interview2"
  | "interview3";

type Props = {
  todayCount: number;
  totalActive: number;
  // waitingCount: number;
  // decidedCount: number;
  setFilterStatus: (s: FilterStatus) => void;
  embedded?: boolean;
};

const OverviewSection: React.FC<Props> = ({
  todayCount,
  totalActive,
  // waitingCount,
  // decidedCount,
  setFilterStatus,
  embedded = false,
}) => {
  const router = useRouter();

  // Overview cards
  const overviewCards = [
    {
      title: "Today:",
      value: todayCount,
      color: "bg-blue-100 border border-blue-300",
      textColor: "text-blue-800",
      icon: <CalendarDays size={18} />,
      onClick: () => setFilterStatus("all"),
    },
    {
      title: "Total:",
      value: totalActive,
      color: "bg-green-100 border border-green-300",
      textColor: "text-green-800",
      icon: <Briefcase size={18} />,
      onClick: () => setFilterStatus("all"),
    },
    // {
    //   title: "Waiting",
    //   value: waitingCount,
    //   color: "bg-gray-100 border border-gray-300",
    //   textColor: "text-gray-800",
    //   icon: <Hourglass size={18} />,
    //   onClick: () => setFilterStatus("resume"),
    // },
    // {
    //   title: "Decided",
    //   value: decidedCount,
    //   color: "bg-purple-100 border border-purple-300",
    //   textColor: "text-purple-800",
    //   icon: <Archive size={18} />,
    //   onClick: () => router.push("/dashboard/archive"),
    // },
  ];

  if (embedded) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide">
          Application Overview
        </h3>
        <SummarySection
          cards={overviewCards}
          grid="grid-cols-2 gap-2"
          className="mb-0"
        />
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
        grid="grid-cols-2 md:grid-cols-4 gap-3"
        className="mb-0"
      />
    </section>
  );
};

export default OverviewSection;
