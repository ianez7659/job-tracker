// Shared app form / heading / button classes. Colors come from the semantic
// tokens in src/app/globals.css (see DESIGN.md) — no raw gray/blue/yellow.

const fieldBase =
  "w-full px-3 py-2 border border-line rounded-lg bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-signal focus:border-signal";

export const inputBase = `${fieldBase} appearance-none`;

export const selectBase = fieldBase;

export const labelBase = "block text-sm font-medium text-ink mb-1";

export const headingBase = "font-display text-2xl font-bold text-ink my-6";

export const buttonBase =
  "bg-signal-solid text-white py-2 px-4 rounded-xl hover:bg-signal-deep text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

export const helperText = "text-xs text-ink-muted mt-1";
