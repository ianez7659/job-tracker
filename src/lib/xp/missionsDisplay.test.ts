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
    expect(p.dailyRemaining).toBe(1);
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
    expect(p.dailyRemaining).toBe(1);
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
    expect(p.dailyRemaining).toBe(2);
    expect(p.weeklyRemaining).toBe(2);
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

  it("fallbackIncompleteMissionsPayload returns four rows", () => {
    const p = fallbackIncompleteMissionsPayload("UTC");
    expect(p.daily).toHaveLength(2);
    expect(p.weekly).toHaveLength(2);
    expect(p.daily.every((m) => !m.completed)).toBe(true);
    expect(p.weekly.every((m) => !m.completed)).toBe(true);
  });
});
