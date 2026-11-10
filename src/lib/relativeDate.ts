const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole local calendar days from `date` to `now` (0 = same day). Future dates clamp to 0. */
export function calendarDaysSince(date: Date, now: Date = new Date()): number {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((end - start) / DAY_MS));
}

/**
 * "Added today" / "Added yesterday" / "Added 12 days ago".
 * Job.appliedAt is set once when the card is created (POST /api/jobs) and is
 * not updated on submit, so it is described as "Added", not "Applied".
 */
export function addedAgoLabel(
  value: string | Date | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const days = calendarDaysSince(date, now);
  if (days === 0) return "Added today";
  if (days === 1) return "Added yesterday";
  return `Added ${days} days ago`;
}
