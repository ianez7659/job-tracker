import { summarizeEffort, type EffortJob } from "./effortSummary";

const DELETED = "2026-11-01T00:00:00.000Z";

describe("summarizeEffort", () => {
  it("returns zeros for an empty list", () => {
    expect(summarizeEffort([])).toEqual({ applicationsSent: 0, interviewsReached: 0 });
  });

  it("counts open stages past Applying as sent, interview stages as interviews", () => {
    const jobs: EffortJob[] = [
      { status: "applying" },
      { status: "resume" },
      { status: "interview1" },
      { status: "interview2" },
      { status: "interview3" },
    ];
    expect(summarizeEffort(jobs)).toEqual({ applicationsSent: 4, interviewsReached: 3 });
  });

  it.each([
    ["applying", 0, 0],
    ["resume", 1, 0],
    ["interview1", 1, 1],
    ["interview2", 1, 1],
    ["interview3", 1, 1],
  ])("counts a rejection that ended at %s as sent=%d, interview=%d", (stage, sent, interviews) => {
    expect(
      summarizeEffort([{ status: "rejected", deletedAt: DELETED, cycleEndStage: stage }]),
    ).toEqual({ applicationsSent: sent, interviewsReached: interviews });
  });

  it.each([
    ["resume", 0],
    ["interview1", 1],
    ["interview3", 1],
  ])("counts an offer that ended at %s as sent, interview=%d", (stage, interviews) => {
    expect(
      summarizeEffort([{ status: "offer", deletedAt: DELETED, cycleEndStage: stage }]),
    ).toEqual({ applicationsSent: 1, interviewsReached: interviews });
  });

  it("counts an offer with a null end stage as sent but not as an interview", () => {
    expect(
      summarizeEffort([{ status: "offer", deletedAt: DELETED, cycleEndStage: null }]),
    ).toEqual({ applicationsSent: 1, interviewsReached: 0 });
  });

  it("does not count a rejection with a null or missing end stage", () => {
    expect(
      summarizeEffort([
        { status: "rejected", deletedAt: DELETED, cycleEndStage: null },
        { status: "rejected", deletedAt: DELETED },
      ]),
    ).toEqual({ applicationsSent: 0, interviewsReached: 0 });
  });

  it("excludes jobs in Trash (deletedAt on a non-terminal status)", () => {
    expect(
      summarizeEffort([
        { status: "resume", deletedAt: DELETED },
        { status: "interview2", deletedAt: new Date(DELETED) },
        { status: "interview1", deletedAt: null },
      ]),
    ).toEqual({ applicationsSent: 1, interviewsReached: 1 });
  });

  it("ignores unknown statuses and malformed rows", () => {
    expect(
      summarizeEffort([
        { status: "wishlist" },
        { status: "rejected", deletedAt: DELETED, cycleEndStage: "unknown" },
        null as unknown as EffortJob,
        { status: 42 } as unknown as EffortJob,
      ]),
    ).toEqual({ applicationsSent: 0, interviewsReached: 0 });
  });
});
