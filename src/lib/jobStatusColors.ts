// Single source of truth for job status colors.
//
// Consumed by the in-app JobCard and by its replica in the landing page's
// tracking section, which previously carried duplicate copies of this map and
// drifted apart. Drives both the card's left status stripe and its status badge.
//
// The interview stages' dark values were chosen against three measured
// constraints on the dark card ground (`dark:bg-slate-600`, #45556c):
//   - badge text vs its own fill >= 4.5 (WCAG AA, small bold text)
//   - fill vs the card behind it >= 1.7, so the badge reads as a pill
//   - consecutive stages >= 1.3 apart, so the funnel is legible
// Progression is carried by hue (yellow -> amber -> orange), the direction light
// mode already travels. Measured results: text 4.94 / 8.71 / 5.42,
// vs card 2.58 / 4.40 / 2.63, separations 1.71 and 1.68.
//
// This replaced two dark-mode defects: interview1 had no `dark:bg-*` at all, and
// interview2/interview3 both resolved to `dark:bg-orange-500`.
export const STATUS_COLORS: Record<string, string> = {
  applying: "bg-indigo-100 text-indigo-900 dark:bg-indigo-600 dark:text-indigo-50",
  resume: "bg-emerald-100 text-emerald-900 dark:bg-emerald-600 dark:text-emerald-50",
  interview1: "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-950",
  interview2: "bg-orange-200 text-orange-900 dark:bg-amber-400 dark:text-amber-950",
  interview3: "bg-orange-400 text-orange-900 dark:bg-orange-500 dark:text-orange-950",
  offer: "bg-green-200 text-green-800",
  rejected: "bg-red-200 text-red-800",
};

/** Fill + label classes for a status, used by both the stripe and the badge. */
export function statusColorClass(status: string): string {
  return STATUS_COLORS[status] ?? "";
}
