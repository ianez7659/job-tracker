import {
  computeLoginStreak,
  computeWeekStrip,
  previousPeriodLabel,
} from "./streakDisplayCore";

describe("streakDisplayCore", () => {
  it("previousPeriodLabel steps back one calendar day", () => {
    expect(previousPeriodLabel("2026-05-08")).toBe("2026-05-07");
    expect(previousPeriodLabel("2026-03-01")).toBe("2026-02-28");
  });

  it("computeLoginStreak counts consecutive claimed periods ending today", () => {
    const tz = "UTC";
    const now = new Date(Date.UTC(2026, 4, 8, 12, 0, 0));
    const keys = new Set(["2026-05-08", "2026-05-07", "2026-05-06"]);
    expect(computeLoginStreak(now, tz, keys)).toBe(3);
  });

  it("computeLoginStreak returns 0 when previous period missed", () => {
    const tz = "UTC";
    const now = new Date(Date.UTC(2026, 4, 8, 12, 0, 0));
    const keys = new Set(["2026-05-06"]);
    expect(computeLoginStreak(now, tz, keys)).toBe(0);
  });

  it("computeWeekStrip returns 7 days", () => {
    const tz = "UTC";
    const now = new Date(Date.UTC(2026, 4, 8, 12, 0, 0)); // Friday UTC calendar
    const strip = computeWeekStrip(now, tz, new Set());
    expect(strip).toHaveLength(7);
    expect(strip.map((d) => d.letter).join("")).toBe("MTWTFSS");
  });
});
