"use client";

import { Flame } from "lucide-react";
import SummarySection from "@/components/SummarySection";

type FilterStatus =
  | "all"
  | "resume"
  | "interview1"
  | "interview2"
  | "interview3";

type Props = {
  counts: Record<string, number>;
  setFilterStatus: (s: FilterStatus) => void;
};

export default function InterviewProgress({ counts, setFilterStatus }: Props) {
  // 카드 데이터를 SummarySection 형식으로 변환
  const interviewCards = [
    {
      title: "Interview 1",
      shortTitle: "INT-1",
      value: counts["interview1"] || 0,
      color: "bg-yellow-100 border border-yellow-300",
      textColor: "text-yellow-800",
      onClick: () => setFilterStatus("interview1" as FilterStatus),
    },
    {
      title: "Interview 2",
      shortTitle: "INT-2",
      value: counts["interview2"] || 0,
      color: "bg-orange-200 border border-orange-400",
      textColor: "text-orange-800",
      onClick: () => setFilterStatus("interview2" as FilterStatus),
    },
    {
      title: "Interview 3",
      shortTitle: "INT-3",
      value: counts["interview3"] || 0,
      color: "bg-orange-300 border border-orange-500",
      textColor: "text-orange-900",
      onClick: () => setFilterStatus("interview3" as FilterStatus),
    },
  ];

  return (
    <section className="mb-4 border border-gray-400 rounded-lg bg-white shadow-sm p-4">
      <h2 className="flex items-center gap-2 font-bold text-xl text-gray-700 mb-4">
        <Flame size={24} aria-hidden="true" />
        Interview Progress
      </h2>

      <SummarySection 
        cards={interviewCards} 
        grid="grid-cols-3" 
        className="mb-0"
      />
    </section>
  );
}
