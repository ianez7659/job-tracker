/** Position level options for job cards (intern/co-op/entry/junior/intermediate/senior/lead). */
export const POSITION_LEVELS = [
  "Intern",
  "Co-op",
  "Entry",
  "Junior",
  "Intermediate",
  "Senior",
  "Lead",
] as const;

export type PositionLevel = (typeof POSITION_LEVELS)[number];
