import {
  isJobCardComplete,
  grantsForJobCreation,
  grantsForCycleCompletion,
  grantDailyActivity,
  grantWeeklyReview,
  XP_DAILY_ACTIVITY,
  XP_JOB_CREATED,
  XP_JOB_CREATED_COMPLETE_BONUS,
  XP_CYCLE_COMPLETED,
  XP_CYCLE_INTERVIEW_BONUS,
  XP_CYCLE_NOTE_BONUS,
  XP_WEEKLY_REVIEW,
} from "./rewards";
import type { XpJobInput } from "./types";

const completeJob: XpJobInput = {
  company: "Acme",
  title: "Engineer",
  status: "resume",
  appliedAt: new Date("2026-05-01"),
  url: "https://example.com/job",
  jd: null,
  cycleEndStage: null,
};

const incompleteJob: XpJobInput = {
  company: "Acme",
  title: "Engineer",
  status: "resume",
  appliedAt: new Date("2026-05-01"),
  url: null, // missing url → incomplete
  jd: null,
  cycleEndStage: null,
};

// ── isJobCardComplete ────────────────────────────────────────────────────────

describe("isJobCardComplete", () => {
  it("returns true when all core fields are filled", () => {
    expect(isJobCardComplete(completeJob)).toBe(true);
  });

  it("returns false when url is missing", () => {
    expect(isJobCardComplete(incompleteJob)).toBe(false);
  });

  it("returns false when company is empty string", () => {
    expect(isJobCardComplete({ ...completeJob, company: "" })).toBe(false);
  });

  it("returns false when title is whitespace only", () => {
    expect(isJobCardComplete({ ...completeJob, title: "   " })).toBe(false);
  });
});

// ── grantsForJobCreation ─────────────────────────────────────────────────────

describe("grantsForJobCreation", () => {
  it("always includes JOB_CREATED grant", () => {
    const grants = grantsForJobCreation(incompleteJob);
    expect(grants).toContainEqual({ reason: "JOB_CREATED", amount: XP_JOB_CREATED });
  });

  it("adds completeness bonus when card is complete", () => {
    const grants = grantsForJobCreation(completeJob);
    expect(grants).toContainEqual({
      reason: "JOB_CREATED_COMPLETE",
      amount: XP_JOB_CREATED_COMPLETE_BONUS,
    });
    expect(grants).toHaveLength(2);
  });

  it("does not add completeness bonus when card is incomplete", () => {
    const grants = grantsForJobCreation(incompleteJob);
    expect(grants).toHaveLength(1);
    expect(grants[0].reason).toBe("JOB_CREATED");
  });

  it("total XP for complete card is 15", () => {
    const total = grantsForJobCreation(completeJob).reduce((s, g) => s + g.amount, 0);
    expect(total).toBe(XP_JOB_CREATED + XP_JOB_CREATED_COMPLETE_BONUS);
  });
});

// ── grantsForCycleCompletion ─────────────────────────────────────────────────

describe("grantsForCycleCompletion", () => {
  it("returns empty array for non-terminal status", () => {
    expect(grantsForCycleCompletion({ ...completeJob, status: "resume" })).toHaveLength(0);
    expect(grantsForCycleCompletion({ ...completeJob, status: "interview2" })).toHaveLength(0);
  });

  it("grants CYCLE_COMPLETED for rejected with no interview and no note", () => {
    const grants = grantsForCycleCompletion({
      ...completeJob,
      status: "rejected",
      cycleEndStage: "resume",
      jd: null,
    });
    expect(grants).toHaveLength(1);
    expect(grants[0]).toEqual({ reason: "CYCLE_COMPLETED", amount: XP_CYCLE_COMPLETED });
  });

  it("grants CYCLE_COMPLETED for offer", () => {
    const grants = grantsForCycleCompletion({
      ...completeJob,
      status: "offer",
      cycleEndStage: "resume",
      jd: null,
    });
    expect(grants[0].reason).toBe("CYCLE_COMPLETED");
  });

  it("adds interview bonus when cycleEndStage is an interview stage", () => {
    const grants = grantsForCycleCompletion({
      ...completeJob,
      status: "rejected",
      cycleEndStage: "interview2",
      jd: null,
    });
    expect(grants.map((g) => g.reason)).toContain("CYCLE_INTERVIEW_BONUS");
  });

  it("does not add interview bonus when cycleEndStage is resume", () => {
    const grants = grantsForCycleCompletion({
      ...completeJob,
      status: "rejected",
      cycleEndStage: "resume",
      jd: null,
    });
    expect(grants.map((g) => g.reason)).not.toContain("CYCLE_INTERVIEW_BONUS");
  });

  it("adds note bonus when jd is non-empty", () => {
    const grants = grantsForCycleCompletion({
      ...completeJob,
      status: "rejected",
      cycleEndStage: "resume",
      jd: "Great experience, learned a lot.",
    });
    expect(grants.map((g) => g.reason)).toContain("CYCLE_NOTE_BONUS");
  });

  it("does not add note bonus when jd is whitespace only", () => {
    const grants = grantsForCycleCompletion({
      ...completeJob,
      status: "rejected",
      cycleEndStage: "resume",
      jd: "   ",
    });
    expect(grants.map((g) => g.reason)).not.toContain("CYCLE_NOTE_BONUS");
  });

  it("awards max XP (45) when all bonuses apply", () => {
    const grants = grantsForCycleCompletion({
      ...completeJob,
      status: "rejected",
      cycleEndStage: "interview3",
      jd: "Final retrospective note.",
    });
    const total = grants.reduce((s, g) => s + g.amount, 0);
    expect(total).toBe(XP_CYCLE_COMPLETED + XP_CYCLE_INTERVIEW_BONUS + XP_CYCLE_NOTE_BONUS);
  });
});

// ── one-shot grants ──────────────────────────────────────────────────────────

describe("grantDailyActivity", () => {
  it("returns DAILY_ACTIVITY with correct amount", () => {
    expect(grantDailyActivity()).toEqual({
      reason: "DAILY_ACTIVITY",
      amount: XP_DAILY_ACTIVITY,
    });
  });
});

describe("grantWeeklyReview", () => {
  it("returns WEEKLY_REVIEW with correct amount", () => {
    expect(grantWeeklyReview()).toEqual({
      reason: "WEEKLY_REVIEW",
      amount: XP_WEEKLY_REVIEW,
    });
  });
});
