"use client";

import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import type { MissionStatus } from "@/lib/xp/missionsDisplayCore";

type Props = {
  drillStatus: MissionStatus;
  allDailyDone: boolean;
};

export default function InterviewDrillCtaButton({ drillStatus, allDailyDone }: Props) {
  const router = useRouter();

  const label =
    drillStatus === "completed"
      ? "Review Drill"
      : drillStatus === "in_progress"
      ? "Continue Drill"
      : "Start Drill";

  const isDone = drillStatus === "completed";
  const isAllDone = allDailyDone && isDone;

  return (
    <div className="mb-3 flex-shrink-0">
      <button
        type="button"
        onClick={() => router.push("/dashboard/interview-drill")}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
          isAllDone
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
            : isDone
            ? "border-emerald-200 bg-emerald-50/60 text-emerald-600 hover:bg-emerald-100/80 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/60"
            : "border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
        }`}
      >
        <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
        {label}
      </button>
    </div>
  );
}
