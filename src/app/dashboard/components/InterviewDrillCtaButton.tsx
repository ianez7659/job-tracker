"use client";

import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import type { MissionStatus } from "@/lib/xp/missionsDisplayCore";

type Props = {
  drillStatus: MissionStatus;
  allDailyDone: boolean;
  /** When true the drill mission is actionable in the Missions list — hide this button. */
  hiddenByMission?: boolean;
};

export default function InterviewDrillCtaButton({ drillStatus, allDailyDone, hiddenByMission = false }: Props) {
  const router = useRouter();

  if (hiddenByMission) return null;

  const isDone = drillStatus === "completed";
  const isAllDone = allDailyDone && isDone;

  const label = isDone ? "Practice Drill" : drillStatus === "in_progress" ? "Continue Drill" : "Start Drill";
  const href = isDone
    ? "/dashboard/interview-drill?mode=practice"
    : "/dashboard/interview-drill";

  return (
    <div className="mb-3 flex-shrink-0">
      <button
        type="button"
        onClick={() => router.push(href)}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 ${
          isAllDone || isDone
            ? "border-line bg-surface hover:border-streak"
            : "border-streak bg-streak/20 hover:bg-streak/30"
        }`}
      >
        <BookOpen className="h-4 w-4 shrink-0 text-streak" aria-hidden />
        {label}
      </button>
    </div>
  );
}
