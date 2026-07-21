// Landing button styles — mirror the dashboard's button design so both surfaces
// share one button language. Dashboard uses: rounded-xl, solid indigo-600 fill
// with hover:indigo-700, or a border-2 outline — no pill shape, no hover lift.
// Size (px/py/text) is applied per-usage.

export const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-indigo-600 font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

export const btnSecondary =
  "inline-flex items-center justify-center rounded-xl border-2 border-line bg-surface font-medium text-ink transition-colors hover:border-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";
