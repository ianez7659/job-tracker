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
  // After interview 3: offer or rejected only
  if (from === "interview3" && (to === "offer" || to === "rejected")) return true;
  // Apply flow: applying → resume (or give up)
  if (from === "applying" && (to === "resume" || to === "rejected")) return true;
  return false;
}

export function statusDisplayLabel(status: string): string {
  if (status === "resume") return "APPLIED";
  return status.toUpperCase();
}
