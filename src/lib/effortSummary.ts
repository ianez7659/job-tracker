/**
 * Effort numbers shown when a seeker closes an application (RejectionSheet).
 *
 * Built only from data the app already stores on each job:
 * - **applications sent** — jobs that got past Applying. Closed jobs count by
 *   the stage they ended at; jobs in Trash do not count.
 * - **interviews reached** — open jobs now at Interview 1–3, plus closed jobs
 *   whose cycle ended at Interview 1–3. Jobs in Trash do not count.
 *
 * Trash = `deletedAt` set on a non-terminal status. Closed = terminal status
 * (which also sets `deletedAt`). See dashboard/trash and dashboard/closed.
 */
import { TERMINAL_STATUSES } from "@/lib/jobPipeline";
import { hasInterviewStage } from "@/lib/xp/cycleStage";

export type EffortJob = {
  status: string;
  deletedAt?: string | Date | null;
  cycleEndStage?: string | null;
};

export type EffortSummary = {
  applicationsSent: number;
  interviewsReached: number;
};

const SENT_STAGES = new Set(["resume", "interview1", "interview2", "interview3"]);

function isTerminal(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

function isTrashed(job: EffortJob): boolean {
  return Boolean(job.deletedAt) && !isTerminal(job.status);
}

function wasSent(job: EffortJob): boolean {
  if (SENT_STAGES.has(job.status)) return true;
  // An offer is only possible from Applied onward, so it was always sent.
  if (job.status === "offer") return true;
  // A rejection counts only when it ended past Applying. A null end stage
  // (older rows) is unknown, so it is not counted.
  if (job.status === "rejected") return SENT_STAGES.has(job.cycleEndStage ?? "");
  return false;
}

function reachedInterview(job: EffortJob): boolean {
  if (isTerminal(job.status)) return hasInterviewStage(job.cycleEndStage);
  return hasInterviewStage(job.status);
}

export function summarizeEffort(jobs: readonly EffortJob[]): EffortSummary {
  let applicationsSent = 0;
  let interviewsReached = 0;
  for (const job of jobs) {
    if (!job || typeof job.status !== "string" || isTrashed(job)) continue;
    if (wasSent(job)) applicationsSent += 1;
    if (reachedInterview(job)) interviewsReached += 1;
  }
  return { applicationsSent, interviewsReached };
}
