// Shared button styles (landing, welcome). Primary fill uses the signal-solid /
// signal-deep tokens so it stays indigo-600 / indigo-700 in both themes:
// rounded-xl, solid fill or a border-2 outline — no pill shape, no hover lift.
// Size (px/py/text) is applied per-usage.

export const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-signal-solid font-semibold text-white transition-colors hover:bg-signal-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

export const btnSecondary =
  "inline-flex items-center justify-center rounded-xl border-2 border-line bg-surface font-medium text-ink transition-colors hover:border-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";
