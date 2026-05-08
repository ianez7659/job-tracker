"use client";

import { Check, Flame, Sparkles } from "lucide-react";
import type { WeekCircleDay } from "@/lib/xp/streakDisplayCore";

export type HeaderStreakPayload = {
  loginStreak: number;
  weekDays: WeekCircleDay[];
};

type Props = {
  data: HeaderStreakPayload | null;
  loading?: boolean;
};

export default function DashboardStreakPanel({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <div className="mt-1 space-y-3" aria-hidden>
        <div className="h-6 w-56 animate-pulse rounded-md bg-white/15" />
        <div className="flex justify-between gap-1 pt-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-white/15" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const streak = Math.max(0, data.loginStreak);
  /** Days 1–2: sparkles · Day 3+: flame (visual milestone only). */
  const streakMilestoneIcon =
    streak >= 3 ? (
      <Flame
        size={22}
        className="shrink-0 drop-shadow-sm sm:h-[26px] sm:w-[26px]"
        fill="#ef4444"
        stroke="#fde68a"
        strokeWidth={2}
        aria-hidden
      />
    ) : (
      <Sparkles
        className="h-5 w-5 shrink-0 text-yellow-200 drop-shadow-sm sm:h-6 sm:w-6"
        aria-hidden
      />
    );

  return (
    <div className="mt-1 space-y-3">
      <p className="inline-flex items-center gap-2 text-base font-bold tabular-nums text-white drop-shadow-sm sm:text-lg">
        {streakMilestoneIcon}
        <span>{streak}-day streak</span>
      </p>

      <div
        className="flex max-w-md justify-between gap-1 sm:gap-2"
        role="list"
        aria-label="This week daily login progress"
      >
        {data.weekDays.map((day, idx) => (
          <div key={`${day.calendarKey}-${idx}`} className="flex flex-col items-center gap-1.5" role="listitem">
            <span className="text-[0.65rem] font-medium uppercase tracking-wide text-white/85 sm:text-xs">
              {day.letter}
            </span>
            <WeekCircle day={day} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekCircle({ day }: { day: WeekCircleDay }) {
  const isFilled =
    day.state === "done" || day.state === "current_done";
  const isCurrentRing =
    day.state === "current_done" || day.state === "current_pending";

  return (
    <div
      className={[
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10",
        isFilled
          ? "border-2 border-[#f59e0b] bg-[#ffeb3b] shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
          : "border-2 border-dashed border-white/90 bg-white/10",
        isCurrentRing
          ? "ring-2 ring-white/70 ring-offset-2 ring-offset-transparent shadow-[0_0_16px_rgba(255,255,255,0.45)]"
          : "",
      ].join(" ")}
      aria-label={`${day.letter}: ${day.state}`}
    >
      {isFilled ? (
        <Check
          className="h-4 w-4 stroke-[3] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
          aria-hidden
        />
      ) : (
        <span className="sr-only">Not completed</span>
      )}
    </div>
  );
}
