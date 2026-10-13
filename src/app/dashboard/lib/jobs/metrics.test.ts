import type { Job } from "@/generated/prisma";
import { JobSource } from "@/generated/prisma";
import { STALE_MS, dashboardCounts, matchesStatusFilter } from "./metrics";

function makeJob(overrides: Partial<Job>): Job {
  return {
    id: "j",
    title: "Title",
    company: "Company",
    status: "resume",
    appliedAt: new Date(),
    createdAt: new Date(),
    tags: null,
    source: JobSource.ONLINE,
    userId: "u1",
    deletedAt: null,
    url: null,
    jd: null,
    resumeFile: null,
    cycleEndStage: null,
    ...overrides,
  } as Job;
}

const staleDate = () => new Date(Date.now() - STALE_MS - 60_000);

describe("dashboardCounts", () => {
  it("derives every dashboard number from one pass so they agree", () => {
    const jobs = [
      makeJob({ id: "a1", status: "applying" }),
      makeJob({ id: "a2", status: "applying", createdAt: staleDate() }),
      makeJob({ id: "r1", status: "resume" }),
      makeJob({ id: "r2", status: "resume" }),
      makeJob({ id: "i1", status: "interview1" }),
      makeJob({ id: "i2", status: "interview2" }),
      makeJob({ id: "i3", status: "interview3" }),
    ];

    expect(dashboardCounts(jobs)).toEqual({
      total: 7,
      applying: 2,
      stale: 1,
      submitted: 5,
      applied: 2,
      interviews: 3,
    });
  });

  it("leaves finished and deleted cards out of every count", () => {
    const jobs = [
      makeJob({ id: "r1", status: "resume" }),
      makeJob({ id: "o1", status: "offer" }),
      makeJob({ id: "x1", status: "rejected" }),
      makeJob({ id: "d1", status: "resume", deletedAt: new Date() }),
    ];

    const counts = dashboardCounts(jobs);
    expect(counts.total).toBe(1);
    expect(counts.submitted).toBe(1);
    expect(counts.applied).toBe(1);
  });

  it("keeps total = applying + submitted and submitted = applied + interviews", () => {
    const jobs = [
      makeJob({ id: "a1", status: "applying", createdAt: staleDate() }),
      makeJob({ id: "r1", status: "resume" }),
      makeJob({ id: "i2", status: "interview2" }),
    ];

    const c = dashboardCounts(jobs);
    expect(c.total).toBe(c.applying + c.submitted);
    expect(c.submitted).toBe(c.applied + c.interviews);
  });

  it("returns zeros for an empty list", () => {
    expect(dashboardCounts([])).toEqual({
      total: 0,
      applying: 0,
      stale: 0,
      submitted: 0,
      applied: 0,
      interviews: 0,
    });
  });

  it("returns zeros instead of throwing on non-array input", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(dashboardCounts(null as unknown as Job[]).total).toBe(0);
    warn.mockRestore();
  });
});

describe("matchesStatusFilter", () => {
  it("matches every interview round with the interviews filter", () => {
    expect(matchesStatusFilter(makeJob({ status: "interview1" }), "interviews")).toBe(true);
    expect(matchesStatusFilter(makeJob({ status: "interview2" }), "interviews")).toBe(true);
    expect(matchesStatusFilter(makeJob({ status: "interview3" }), "interviews")).toBe(true);
    expect(matchesStatusFilter(makeJob({ status: "resume" }), "interviews")).toBe(false);
  });

  it("treats postApplying as every stage past Applying", () => {
    expect(matchesStatusFilter(makeJob({ status: "resume" }), "postApplying")).toBe(true);
    expect(matchesStatusFilter(makeJob({ status: "interview2" }), "postApplying")).toBe(true);
    expect(matchesStatusFilter(makeJob({ status: "applying" }), "postApplying")).toBe(false);
  });

  it("matches a single stage exactly and everything for all", () => {
    expect(matchesStatusFilter(makeJob({ status: "resume" }), "resume")).toBe(true);
    expect(matchesStatusFilter(makeJob({ status: "interview1" }), "resume")).toBe(false);
    expect(matchesStatusFilter(makeJob({ status: "applying" }), "all")).toBe(true);
  });

  it("does not match an unknown status against a stage filter", () => {
    expect(matchesStatusFilter(makeJob({ status: "archived" }), "applying")).toBe(false);
  });
});
