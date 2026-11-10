import { addedAgoLabel, calendarDaysSince } from "./relativeDate";

const now = new Date(2026, 10, 9, 9, 0); // 2026-11-09 09:00 local

describe("calendarDaysSince", () => {
  it("counts calendar days, not 24h blocks", () => {
    expect(calendarDaysSince(new Date(2026, 10, 8, 23, 59), now)).toBe(1);
    expect(calendarDaysSince(new Date(2026, 10, 9, 0, 1), now)).toBe(0);
  });

  it("clamps future dates to 0", () => {
    expect(calendarDaysSince(new Date(2026, 10, 12), now)).toBe(0);
  });
});

describe("addedAgoLabel", () => {
  it.each([
    [new Date(2026, 10, 9, 8, 0), "Added today"],
    [new Date(2026, 10, 8, 10, 0), "Added yesterday"],
    [new Date(2026, 9, 28), "Added 12 days ago"],
  ])("labels %s as %s", (date, label) => {
    expect(addedAgoLabel(date, now)).toBe(label);
  });

  it("accepts an ISO string", () => {
    expect(addedAgoLabel(new Date(2026, 10, 7).toISOString(), now)).toBe("Added 2 days ago");
  });

  it("returns null for missing or invalid input", () => {
    expect(addedAgoLabel(null, now)).toBeNull();
    expect(addedAgoLabel(undefined, now)).toBeNull();
    expect(addedAgoLabel("not a date", now)).toBeNull();
  });
});
