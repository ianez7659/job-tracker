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

/** Normalize YYYY-M-D strings for stable comparison (DB / legacy keys). */
export function normalizePeriodKey(key: string): string {
  const parts = key.trim().split("-");
  if (parts.length !== 3) return key;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return key;
  }
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** Pure Gregorian: (y,m,d) 하루 전 (UTC 달력 연산). */
function prevGregorianDay(y: number, m: number, d: number): { y: number; m: number; d: number } {
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

/**
 * Parse calendar parts in an IANA zone. Uses formatToParts so we never rely on
 * locale-specific date string separators (en-CA can be YYYY-MM-DD or YYYY/MM/DD).
 */
function computeDailyPeriodKeyInZone(
  instant: Date,
  timeZone: string,
  anchorHour: number,
): string | null {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      hourCycle: "h23",
    });
    const parts = dtf.formatToParts(instant);
    const num = (t: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === t)?.value ?? "NaN");
    const y = num("year");
    const m = num("month");
    const d = num("day");
    const hour = num("hour");
    if (![y, m, d, hour].every((n) => Number.isFinite(n))) return null;
    if (hour < anchorHour) {
      const prev = prevGregorianDay(y, m, d);
      return `${prev.y}-${pad2(prev.m)}-${pad2(prev.d)}`;
    }
    return `${y}-${pad2(m)}-${pad2(d)}`;
  } catch {
    return null;
  }
}

/** UTC-only fallback if a zone string fails parsing (should be rare). */
function dailyPeriodKeyUtcCalendar(instant: Date, anchorHour: number): string {
  const y = instant.getUTCFullYear();
  const m = instant.getUTCMonth() + 1;
  const d = instant.getUTCDate();
  const hour = instant.getUTCHours();
  if (hour < anchorHour) {
    const prev = prevGregorianDay(y, m, d);
    return `${prev.y}-${pad2(prev.m)}-${pad2(prev.d)}`;
  }
  return `${y}-${pad2(m)}-${pad2(d)}`;
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
  const key = computeDailyPeriodKeyInZone(instant, timeZone, anchorHour);
  if (key !== null) return key;
  if (timeZone !== "UTC") {
    const utcTry = computeDailyPeriodKeyInZone(instant, "UTC", anchorHour);
    if (utcTry !== null) return utcTry;
  }
  return dailyPeriodKeyUtcCalendar(instant, anchorHour);
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
  dailyTimeZone?: string | null;
}): string | null {
  if (row.lastDailyPeriodKey) {
    return normalizePeriodKey(row.lastDailyPeriodKey);
  }
  if (row.lastDailyAt) {
    const tz =
      row.dailyTimeZone && isValidIanaTimeZone(row.dailyTimeZone)
        ? row.dailyTimeZone
        : "UTC";
    return getDailyPeriodKey(row.lastDailyAt, tz);
  }
  return null;
}
