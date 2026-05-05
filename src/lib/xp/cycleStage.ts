// Derives the cycleEndStage for a job closing at a terminal status.
// cycleEndStage = the last non-terminal stage the application reached.
//
// Pipeline order: applying → resume → interview1 → interview2 → interview3
// Terminal: offer, rejected
//
// Usage: call deriveCycleEndStage(previousStatus) when status changes to
// offer or rejected, then persist the result on the Job row.

const PIPELINE_ORDER = [
  "applying",
  "resume",
  "interview1",
  "interview2",
  "interview3",
] as const;

type PipelineStage = (typeof PIPELINE_ORDER)[number];
const TERMINAL_STATUSES = new Set(["offer", "rejected"]);

/**
 * Returns the cycleEndStage to store on a Job when it transitions to a
 * terminal status (offer | rejected).
 *
 * `previousStatus` is the status the job held immediately before the terminal
 * transition. Returns null if previousStatus is already terminal or unknown.
 *
 * Examples:
 *   deriveCycleEndStage("interview2") → "interview2"
 *   deriveCycleEndStage("resume")     → "resume"
 *   deriveCycleEndStage("applying")   → "applying"
 *   deriveCycleEndStage("rejected")   → null  (already terminal)
 */
export function deriveCycleEndStage(
  previousStatus: string,
): PipelineStage | null {
  if (TERMINAL_STATUSES.has(previousStatus)) return null;
  const stage = PIPELINE_ORDER.find((s) => s === previousStatus);
  return stage ?? null;
}

/**
 * Returns true if the given cycleEndStage qualifies for the interview bonus.
 * Eligible stages: interview1, interview2, interview3.
 */
export function hasInterviewStage(cycleEndStage: string | null | undefined): boolean {
  if (!cycleEndStage) return false;
  return ["interview1", "interview2", "interview3"].includes(cycleEndStage);
}
