import {
  computeMissionsPayload,
  fallbackIncompleteMissionsPayload,
} from "./missionsDisplayCore";

describe("computeMissionsPayload", () => {
  const now = new Date("2026-05-06T14:00:00.000Z");
  const tz = "UTC";

  it("marks daily check-in done when last daily period matches current", () => {
    const p = computeMissionsPayload({
      now,
      timeZone: tz,
      lastDailyPeriodKey: "2026-05-06",
      lastDailyAt: now,
      dailyTimeZoneFromRow: "UTC",
      jobCreatedInCurrentPeriod: false,
      weeklyReviewDone: false,
      cycleCompletedThisWeek: false,
    });
    expect(p.daily[0].id).toBe("daily_check_in");
    expect(p.daily[0].completed).toBe(true);
    // job_card + interview_drill still incomplete → 2 remaining
    expect(p.dailyRemaining).toBe(2);
  });

  it("marks daily check-in incomplete when no claim for current period", () => {
    const p = computeMissionsPayload({
      now,
      timeZone: tz,
      lastDailyPeriodKey: "2026-05-05",
      lastDailyAt: new Date("2026-05-05T10:00:00.000Z"),
      dailyTimeZoneFromRow: "UTC",
      jobCreatedInCurrentPeriod: true,
      weeklyReviewDone: true,
      cycleCompletedThisWeek: true,
    });
    expect(p.daily[0].completed).toBe(false);
    expect(p.daily[1].completed).toBe(true);
    expect(p.weekly.every((w) => w.completed)).toBe(true);
    // check_in + interview_drill still incomplete → 2 remaining
    expect(p.dailyRemaining).toBe(2);
    expect(p.weeklyRemaining).toBe(0);
  });

  it("counts remaining missions", () => {
    const p = computeMissionsPayload({
      now,
      timeZone: tz,
      lastDailyPeriodKey: null,
      lastDailyAt: null,
      dailyTimeZoneFromRow: null,
      jobCreatedInCurrentPeriod: false,
      weeklyReviewDone: false,
      cycleCompletedThisWeek: false,
    });
    // 3 daily missions (check_in + job_card + interview_drill), all incomplete
    expect(p.dailyRemaining).toBe(3);
    expect(p.weeklyRemaining).toBe(2);
  });

  it("quiz row is not_started with Start CTA when no quizStatus provided", () => {
    const p = computeMissionsPayload({
      now,
      timeZone: tz,
      lastDailyPeriodKey: null,
      lastDailyAt: null,
      dailyTimeZoneFromRow: null,
      jobCreatedInCurrentPeriod: false,
      weeklyReviewDone: false,
      cycleCompletedThisWeek: false,
    });
    const drill = p.daily.find((m) => m.id === "daily_interview_drill")!;
    expect(drill.completed).toBe(false);
    expect(drill.status).toBe("not_started");
    expect(drill.ctaLabel).toBe("Start");
    expect(drill.progressLabel).toBe("0/5");
    expect(drill.rewardLabel).toBe("+10 XP");
    expect(drill.href).toBe("/dashboard/interview-drill");
  });

  it("quiz row shows Continue CTA when in_progress", () => {
    const p = computeMissionsPayload({
      now,
      timeZone: tz,
      lastDailyPeriodKey: null,
      lastDailyAt: null,
      dailyTimeZoneFromRow: null,
      jobCreatedInCurrentPeriod: false,
      weeklyReviewDone: false,
      cycleCompletedThisWeek: false,
      quizStatus: "in_progress",
      quizCompletedQuestions: 3,
      quizTotalQuestions: 5,
    });
    const drill = p.daily.find((m) => m.id === "daily_interview_drill")!;
    expect(drill.completed).toBe(false);
    expect(drill.status).toBe("in_progress");
    expect(drill.ctaLabel).toBe("Continue");
    expect(drill.progressLabel).toBe("3/5");
    expect(drill.rewardLabel).toBe("+10 XP");
  });

  it("quiz row shows completed state with Review CTA", () => {
    const p = computeMissionsPayload({
      now,
      timeZone: tz,
      lastDailyPeriodKey: null,
      lastDailyAt: null,
      dailyTimeZoneFromRow: null,
      jobCreatedInCurrentPeriod: false,
      weeklyReviewDone: false,
      cycleCompletedThisWeek: false,
      quizStatus: "completed",
      quizCompletedQuestions: 5,
      quizTotalQuestions: 5,
    });
    const drill = p.daily.find((m) => m.id === "daily_interview_drill")!;
    expect(drill.completed).toBe(true);
    expect(drill.status).toBe("completed");
    expect(drill.ctaLabel).toBe("Review");
    expect(drill.progressLabel).toBe("Completed");
    expect(drill.rewardLabel).toBe("+10 XP earned");
    // completed quiz reduces dailyRemaining
    expect(p.dailyRemaining).toBe(2); // check_in + job_card still incomplete
  });

  it("uses current timezone when row dailyTimeZone is missing", () => {
    const p = computeMissionsPayload({
      now: new Date("2026-05-06T02:00:00.000Z"), // 19:00 previous day in America/Los_Angeles
      timeZone: "America/Los_Angeles",
      lastDailyPeriodKey: null,
      lastDailyAt: new Date("2026-05-06T01:30:00.000Z"), // same local period
      dailyTimeZoneFromRow: null, // legacy DB column missing
      jobCreatedInCurrentPeriod: false,
      weeklyReviewDone: false,
      cycleCompletedThisWeek: false,
    });
    expect(p.daily[0].id).toBe("daily_check_in");
    expect(p.daily[0].completed).toBe(true);
  });

  it("fallbackIncompleteMissionsPayload returns five rows (3 daily, 2 weekly)", () => {
    const p = fallbackIncompleteMissionsPayload("UTC");
    expect(p.daily).toHaveLength(3);
    expect(p.weekly).toHaveLength(2);
    expect(p.daily.every((m) => !m.completed)).toBe(true);
    expect(p.weekly.every((m) => !m.completed)).toBe(true);
  });
});
