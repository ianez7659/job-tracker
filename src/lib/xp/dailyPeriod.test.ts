import {
  DAILY_ANCHOR_HOUR,
  effectiveLastDailyPeriodKey,
  getDailyPeriodKey,
  isDailyRewardEligibleForPeriod,
  isValidIanaTimeZone,
  normalizePeriodKey,
} from "./dailyPeriod";

describe("isValidIanaTimeZone", () => {
  it("accepts common IANA ids", () => {
    expect(isValidIanaTimeZone("America/Vancouver")).toBe(true);
    expect(isValidIanaTimeZone("Asia/Seoul")).toBe(true);
    expect(isValidIanaTimeZone("UTC")).toBe(true);
  });

  it("rejects garbage", () => {
    expect(isValidIanaTimeZone("")).toBe(false);
    expect(isValidIanaTimeZone("Not/AZone")).toBe(false);
  });
});

describe("getDailyPeriodKey", () => {
  it("uses anchor hour (default 5): before 5am counts as previous calendar day", () => {
    // Vancouver 2026-05-06 03:00 → still "2026-05-05" period
    const instant = new Date("2026-05-06T10:00:00.000Z"); // check: Vanc PDT is UTC-7 → local May 6 03:00
    const key = getDailyPeriodKey(instant, "America/Vancouver", DAILY_ANCHOR_HOUR);
    expect(key).toBe("2026-05-05");
  });

  it("at or after anchor uses same calendar day", () => {
    const instant = new Date("2026-05-06T15:00:00.000Z");
    const key = getDailyPeriodKey(instant, "America/Vancouver", DAILY_ANCHOR_HOUR);
    expect(key).toBe("2026-05-06");
  });
});

describe("isDailyRewardEligibleForPeriod", () => {
  it("eligible when never claimed", () => {
    expect(isDailyRewardEligibleForPeriod(null, "2026-05-04")).toBe(true);
  });

  it("not eligible when same period", () => {
    expect(isDailyRewardEligibleForPeriod("2026-05-04", "2026-05-04")).toBe(false);
  });

  it("eligible when period rolled", () => {
    expect(isDailyRewardEligibleForPeriod("2026-05-04", "2026-05-05")).toBe(true);
  });

  it("treats unpadded keys as equal to padded", () => {
    expect(
      isDailyRewardEligibleForPeriod(
        normalizePeriodKey("2026-5-4"),
        normalizePeriodKey("2026-05-04"),
      ),
    ).toBe(false);
  });
});

describe("normalizePeriodKey", () => {
  it("pads month and day", () => {
    expect(normalizePeriodKey("2026-5-7")).toBe("2026-05-07");
    expect(normalizePeriodKey("2026-12-01")).toBe("2026-12-01");
  });
});

describe("effectiveLastDailyPeriodKey", () => {
  it("uses stored IANA TZ when inferring from lastDailyAt (not hard-coded UTC)", () => {
    const lastDailyAt = new Date("2026-05-07T01:00:00.000Z"); // 10:00 KST same calendar day
    const keyUtc = getDailyPeriodKey(lastDailyAt, "UTC");
    const keySeoul = getDailyPeriodKey(lastDailyAt, "Asia/Seoul");
    expect(keyUtc).not.toBe(keySeoul);

    expect(
      effectiveLastDailyPeriodKey({
        lastDailyPeriodKey: null,
        lastDailyAt,
        dailyTimeZone: "Asia/Seoul",
      }),
    ).toBe(keySeoul);

    expect(
      effectiveLastDailyPeriodKey({
        lastDailyPeriodKey: null,
        lastDailyAt,
        dailyTimeZone: null,
      }),
    ).toBe(keyUtc);
  });

  it("normalizes stored lastDailyPeriodKey", () => {
    expect(
      effectiveLastDailyPeriodKey({
        lastDailyPeriodKey: "2026-5-7",
        lastDailyAt: new Date(),
        dailyTimeZone: "UTC",
      }),
    ).toBe("2026-05-07");
  });
});
