/**
 * Login streak + Mon–Sun week strip (pure). Uses same daily period keys as dailyPeriod (5am anchor).
 */

import {
  DAILY_ANCHOR_HOUR,
  getDailyPeriodKey,
  normalizePeriodKey,
} from "./dailyPeriod";

export type WeekCircleState =
  | "done"
  | "current_done"
  | "current_pending"
  | "upcoming"
  | "missed";

export type WeekCircleDay = {
  letter: string;
  calendarKey: string;
  periodKey: string;
  state: WeekCircleState;
};

export type LoginStreakDisplay = {
  loginStreak: number;
  weekDays: WeekCircleDay[];
};

const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Calendar {y,m,d} in IANA zone at instant. */
export function getCalendarPartsInZone(
  instant: Date,
  timeZone: string,
): { y: number; m: number; d: number } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const num = (t: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === t)?.value ?? "NaN");
  const y = num("year");
  const m = num("month");
  const d = num("day");
  if (![y, m, d].every((n) => Number.isFinite(n))) {
    return {
      y: instant.getUTCFullYear(),
      m: instant.getUTCMonth() + 1,
      d: instant.getUTCDate(),
    };
  }
  return { y, m, d };
}

/** Monday = 0 … Sunday = 6 (locale weekday short in zone). */
export function weekdayMon0Sun6(instant: Date, timeZone: string): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
    });
    const wd = dtf.format(instant);
    const map: Record<string, number> = {
      Mon: 0,
      Tue: 1,
      Wed: 2,
      Thu: 3,
      Fri: 4,
      Sat: 5,
      Sun: 6,
    };
    return map[wd] ?? 0;
  } catch {
    return 0;
  }
}

function calendarKeyFromParts(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** Gregorian add on calendar numbers (UTC Date rolls month). */
export function addCalendarDays(
  y: number,
  m: number,
  d: number,
  delta: number,
): { y: number; m: number; d: number } {
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth() + 1,
    d: dt.getUTCDate(),
  };
}

/**
 * Find an instant whose calendar day in `tz` equals (y,m,d); hourly scan covers DST.
 */
export function instantForCalendarDayMidpoint(
  y: number,
  m: number,
  d: number,
  timeZone: string,
): Date {
  const start = Date.UTC(y, m - 1, d - 1, 0, 0, 0);
  for (let h = 0; h < 96; h++) {
    const t = new Date(start + h * 3600 * 1000);
    const p = getCalendarPartsInZone(t, timeZone);
    if (p.y === y && p.m === m && p.d === d) return t;
  }
  return new Date(Date.UTC(y, m - 1, d, 18, 0, 0));
}

export function previousPeriodLabel(key: string): string {
  const n = normalizePeriodKey(key);
  const parts = n.split("-").map(Number);
  const y = parts[0]!;
  const mo = parts[1]!;
  const d = parts[2]!;
  const prev = addCalendarDays(y, mo, d, -1);
  return calendarKeyFromParts(prev.y, prev.m, prev.d);
}

/**
 * Consecutive login streak from DAILY_ACTIVITY period keys.
 * If today’s period not claimed yet, streak counts through yesterday’s period if yesterday was claimed.
 */
export function computeLoginStreak(
  now: Date,
  timeZone: string,
  claimedPeriodKeys: ReadonlySet<string>,
): number {
  const currentKey = normalizePeriodKey(getDailyPeriodKey(now, timeZone));
  const hasToday = claimedPeriodKeys.has(currentKey);
  const prevKey = previousPeriodLabel(currentKey);
  const hasPrev = claimedPeriodKeys.has(prevKey);

  let startKey: string | null = null;
  if (hasToday) {
    startKey = currentKey;
  } else if (hasPrev) {
    startKey = prevKey;
  } else {
    return 0;
  }

  let n = 0;
  let k = startKey;
  while (claimedPeriodKeys.has(normalizePeriodKey(k))) {
    n += 1;
    k = previousPeriodLabel(k);
  }
  return n;
}

function compareCalendarKeys(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function computeWeekStrip(
  now: Date,
  timeZone: string,
  claimedPeriodKeys: ReadonlySet<string>,
): WeekCircleDay[] {
  const todayParts = getCalendarPartsInZone(now, timeZone);
  const todayKey = calendarKeyFromParts(
    todayParts.y,
    todayParts.m,
    todayParts.d,
  );

  const wd = weekdayMon0Sun6(now, timeZone);

  const monday = addCalendarDays(todayParts.y, todayParts.m, todayParts.d, -wd);

  const weekDays: WeekCircleDay[] = [];
  for (let i = 0; i < 7; i++) {
    const { y, m, d } = addCalendarDays(monday.y, monday.m, monday.d, i);
    const calendarKey = calendarKeyFromParts(y, m, d);
    const instant = instantForCalendarDayMidpoint(y, m, d, timeZone);
    const periodKey = normalizePeriodKey(
      getDailyPeriodKey(instant, timeZone, DAILY_ANCHOR_HOUR),
    );
    const claimed = claimedPeriodKeys.has(periodKey);
    const cmp = compareCalendarKeys(calendarKey, todayKey);
    const isToday = cmp === 0;
    const isFuture = cmp > 0;

    let state: WeekCircleState;
    if (isFuture) {
      state = "upcoming";
    } else if (isToday) {
      state = claimed ? "current_done" : "current_pending";
    } else {
      state = claimed ? "done" : "missed";
    }

    weekDays.push({
      letter: WEEK_LETTERS[i] ?? "—",
      calendarKey,
      periodKey,
      state,
    });
  }

  return weekDays;
}

export function computeLoginStreakDisplay(
  now: Date,
  timeZone: string,
  claimedPeriodKeys: ReadonlySet<string>,
): LoginStreakDisplay {
  const loginStreak = computeLoginStreak(now, timeZone, claimedPeriodKeys);
  const weekDays = computeWeekStrip(now, timeZone, claimedPeriodKeys);
  return { loginStreak, weekDays };
}
