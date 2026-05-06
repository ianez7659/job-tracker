/**
 * “당일” 경계: 로컬(또는 IANA 타임존) 기준 매일 anchorHour(기본 5시)에 새 구간 시작.
 * 같은 구간 안에서는 하루에 일일 XP를 한 번만 줄 수 있도록 period key(YYYY-MM-DD)로 비교한다.
 */

export const DAILY_ANCHOR_HOUR = 5;

export function isValidIanaTimeZone(tz: string): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Pure Gregorian: (y,m,d) 하루 전 (UTC 달력 연산). */
function prevGregorianDay(y: number, m: number, d: number): { y: number; m: number; d: number } {
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

/**
 * 주어진 순간이 속한 “일일 구간”의 식별자.
 * 구간: [해당 날짜 anchorHour, 다음 날 anchorHour)
 * 예: anchor 5시 → 5/6 03:00 은 5/5 구간.
 */
export function getDailyPeriodKey(
  instant: Date,
  timeZone: string,
  anchorHour = DAILY_ANCHOR_HOUR,
): string {
  const wall = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);

  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .find((p) => p.type === "hour")?.value ?? "0",
    10,
  );

  const [y, m, d] = wall.split("-").map(Number);
  if (hour < anchorHour) {
    const prev = prevGregorianDay(y, m, d);
    return `${prev.y}-${pad2(prev.m)}-${pad2(prev.d)}`;
  }
  return wall;
}

/** 마지막으로 일일 XP를 받은 구간과 현재 구간이 다르면 지급 가능. */
export function isDailyRewardEligibleForPeriod(
  lastPeriodKey: string | null,
  currentPeriodKey: string,
): boolean {
  if (lastPeriodKey === null) return true;
  return lastPeriodKey !== currentPeriodKey;
}

/**
 * DB row → “마지막으로 일일 XP를 받은 period key”.
 * `lastDailyPeriodKey`가 없고 예전 `lastDailyAt`만 있으면 UTC 기준 키로 보수적으로 맞춘다.
 */
export function effectiveLastDailyPeriodKey(row: {
  lastDailyPeriodKey: string | null;
  lastDailyAt: Date | null;
}): string | null {
  if (row.lastDailyPeriodKey) return row.lastDailyPeriodKey;
  if (row.lastDailyAt) return getDailyPeriodKey(row.lastDailyAt, "UTC");
  return null;
}
