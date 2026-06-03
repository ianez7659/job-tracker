export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
] as const;

export const WORK_ARRANGEMENTS = ["on_site", "remote", "hybrid"] as const;

export const SALARY_RANGES = [
  "not_disclosed",
  "under_40k",
  "40k_50k",
  "50k_60k",
  "60k_70k",
  "70k_80k",
  "80k_plus",
] as const;

export const HIRED_OFFER_STATUSES = [
  "pending",
  "current_hired",
  "inactive",
  "not_selected",
  "unverifiable",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type WorkArrangement = (typeof WORK_ARRANGEMENTS)[number];
export type SalaryRange = (typeof SALARY_RANGES)[number];
export type HiredOfferStatus = (typeof HIRED_OFFER_STATUSES)[number];
