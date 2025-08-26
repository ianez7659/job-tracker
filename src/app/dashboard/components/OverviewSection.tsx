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
  waitingCount: number;
  decidedCount: number;
  setFilterStatus: (s: FilterStatus) => void;
};

const OverviewSection: React.FC<Props> = ({
  todayCount,
  totalActive,
  waitingCount,
  decidedCount,
  setFilterStatus,
}) => {
  const router = useRouter();

  // 카드 데이터를 배열로 정의
  const overviewCards = [
    {
      title: "Today",
      value: todayCount,
      color: "bg-blue-100 border border-blue-300",
      textColor: "text-blue-800",
      icon: <CalendarDays size={18} />,
      onClick: () => setFilterStatus("all"),
    },
    {
      title: "Total",
      value: totalActive,
      color: "bg-green-100 border border-green-300",
      textColor: "text-green-800",
      icon: <Briefcase size={18} />,
      onClick: () => setFilterStatus("all"),
    },
    {
      title: "Waiting",
      value: waitingCount,
      color: "bg-gray-100 border border-gray-300",
      textColor: "text-gray-800",
      icon: <Hourglass size={18} />,
      onClick: () => setFilterStatus("resume"),
    },
    {
      title: "Decided",
      value: decidedCount,
      color: "bg-purple-100 border border-purple-300",
      textColor: "text-purple-800",
      icon: <Archive size={18} />,
      onClick: () => router.push("/dashboard/archive"),
    },
  ];

  return (
    <section className="mb-4 border border-gray-400 rounded-lg bg-white shadow-sm p-4">
      <h2 className="flex items-center gap-2 font-bold text-xl text-gray-700 mb-4">
        <ClipboardList size={24} aria-hidden="true" />
        Application Overview
      </h2>

      {/* Row 1: Today --- Total */}
      <SummarySection 
        cards={overviewCards.slice(0, 2)} 
        grid="grid-cols-2" 
        className="mb-4"
      />

      {/* Row 2: Waiting --- Decided */}
      <SummarySection 
        cards={overviewCards.slice(2, 4)} 
        grid="grid-cols-2" 
        className="mb-0"
      />
    </section>
  );
};

export default OverviewSection;
