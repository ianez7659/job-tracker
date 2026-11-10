// Guided pipeline: status changes only along allowed transitions (no arbitrary jumps).
// applying → resume is done from Apply flow; dashboard advances the rest.

export const TERMINAL_STATUSES = ["offer", "rejected"] as const;

// Single-step forward in the main funnel (excluding terminal outcomes). 
export function getNextStage(current: string): string | null {
  const map: Record<string, string> = {
    applying: "resume",
    resume: "interview1",
    interview1: "interview2",
    interview2: "interview3",
  };
  return map[current] ?? null;
}

// Labels for primary "advance" button.
export function getAdvanceButtonLabel(current: string): string | null {
  const next = getNextStage(current);
  if (!next) return null;
  const labels: Record<string, string> = {
    applying: "Submit on Apply page → Applied",
    resume: "Move to Interview 1",
    interview1: "Move to Interview 2",
    interview2: "Move to Interview 3",
  };
  return labels[current] ?? null;
}

// Returns true if `to` is allowed from `from` (single step or withdraw / outcome).
export function isAllowedStatusTransition(from: string, to: string): boolean {
  if (from === to) return true;
  if (from === "offer" || from === "rejected") {
    return false;
  }
  const next = getNextStage(from);
  if (next && to === next) return true;
  // Withdraw / no from pipeline before final interview outcome
  if (to === "rejected" && !TERMINAL_STATUSES.includes(from as "offer" | "rejected")) {
    return true;
  }
  // Offer from Applied onward (early acceptance before final round)
  if (
    to === "offer" &&
    ["resume", "interview1", "interview2", "interview3"].includes(from)
  ) {
    return true;
  }
  // Apply flow: applying → resume (or give up)
  if (from === "applying" && (to === "resume" || to === "rejected")) return true;
  return false;
}

// Human labels for stored statuses. `resume` is shown as "Applied" (PRODUCT.md terminology).
const STAGE_LABELS: Record<string, string> = {
  applying: "Applying",
  resume: "Applied",
  interview1: "Interview 1",
  interview2: "Interview 2",
  interview3: "Interview 3",
  offer: "Offer",
  rejected: "Rejected",
};

/** User-facing label for a status. Unknown values pass through unchanged. */
export function statusDisplayLabel(status: string): string {
  return STAGE_LABELS[status] ?? status;
}

/**
 * Label of the stage a board card can move to in one tap, or null when the
 * next step is not a single stage move: applying → Applied goes through the
 * Apply flow, and interview3 ends with Offer / Rejected on the detail page.
 */
export function getNextStageLabel(current: string): string | null {
  if (current === "applying") return null;
  const next = getNextStage(current);
  return next ? statusDisplayLabel(next) : null;
}

// ── Guided Rail ────────────────────────────────────────────────────────────

/** Open checkpoints in rail order; the sixth node is the outcome. */
export const RAIL_STAGES = [
  "applying",
  "resume",
  "interview1",
  "interview2",
  "interview3",
] as const;

export type RailNodeState =
  | "done"
  | "current"
  | "upcoming"
  /** A closed cycle ended before this stage — never drawn as passed. */
  | "notReached"
  | "offer"
  | "rejected";

export type RailNode = {
  key: (typeof RAIL_STAGES)[number] | "outcome";
  label: string;
  state: RailNodeState;
};

/** "Checkpoint 3 of 6" for an open stage, "Closed" for an outcome, null when unknown. */
export function railPositionLabel(status: string): string | null {
  if (status === "offer" || status === "rejected") return "Closed";
  const i = (RAIL_STAGES as readonly string[]).indexOf(status);
  return i === -1 ? null : `Checkpoint ${i + 1} of ${RAIL_STAGES.length + 1}`;
}

/**
 * Six-node rail for a job: Applying → Applied → Interview 1 → 2 → 3 → Outcome.
 *
 * For a closed job (offer / rejected), `cycleEndStage` — the last open stage,
 * recorded by the API when the outcome was set — decides which stages were
 * really passed. Stages after it are `notReached`, so an early offer from
 * Applied never reads as three passed interviews. Without a recorded end stage
 * no stage is claimed as passed.
 */
export function getRailNodes(
  status: string,
  cycleEndStage?: string | null,
): RailNode[] {
  const isClosed = status === "offer" || status === "rejected";
  const anchor = isClosed ? cycleEndStage ?? null : status;
  const anchorIndex = anchor
    ? (RAIL_STAGES as readonly string[]).indexOf(anchor)
    : -1;

  const stages: RailNode[] = RAIL_STAGES.map((key, i) => {
    let state: RailNodeState;
    if (isClosed) {
      state = i <= anchorIndex ? "done" : "notReached";
    } else if (anchorIndex === -1) {
      state = "upcoming";
    } else {
      state = i < anchorIndex ? "done" : i === anchorIndex ? "current" : "upcoming";
    }
    return { key, label: statusDisplayLabel(key), state };
  });

  const outcome: RailNode = isClosed
    ? { key: "outcome", label: statusDisplayLabel(status), state: status as "offer" | "rejected" }
    : { key: "outcome", label: "Outcome", state: "upcoming" };

  return [...stages, outcome];
}
