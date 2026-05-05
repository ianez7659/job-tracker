import {
  buildCurrentStatusEntries,
  buildCycleEndEntries,
  countClosedCycles,
  type StatsJobInput,
} from "./statsTransforms";

// ── buildCurrentStatusEntries ─────────────────────────────────────────────────

describe("buildCurrentStatusEntries", () => {
  it("returns all 5 pipeline stages with zero counts for empty input", () => {
    const result = buildCurrentStatusEntries([]);
    expect(result.map((e) => e.key)).toEqual([
      "applying",
      "resume",
      "interview1",
      "interview2",
      "interview3",
    ]);
    expect(result.every((e) => e.count === 0)).toBe(true);
  });

  it("counts active non-terminal jobs by status", () => {
    const jobs: StatsJobInput[] = [
      { status: "applying" },
      { status: "applying" },
      { status: "resume" },
      { status: "interview1" },
    ];
    const result = buildCurrentStatusEntries(jobs);
    expect(result.find((e) => e.key === "applying")?.count).toBe(2);
    expect(result.find((e) => e.key === "resume")?.count).toBe(1);
    expect(result.find((e) => e.key === "interview1")?.count).toBe(1);
    expect(result.find((e) => e.key === "interview2")?.count).toBe(0);
  });

  it("excludes deleted jobs", () => {
    const jobs: StatsJobInput[] = [
      { status: "applying", deletedAt: new Date() },
      { status: "applying" },
    ];
    const result = buildCurrentStatusEntries(jobs);
    expect(result.find((e) => e.key === "applying")?.count).toBe(1);
  });

  it("excludes terminal-status jobs (offer, rejected)", () => {
    const jobs: StatsJobInput[] = [
      { status: "offer" },
      { status: "rejected" },
      { status: "resume" },
    ];
    const result = buildCurrentStatusEntries(jobs);
    // offer and rejected should not appear in Current tab
    expect(result.find((e) => e.key === "offer")).toBeUndefined();
    expect(result.find((e) => e.key === "rejected")).toBeUndefined();
    expect(result.find((e) => e.key === "resume")?.count).toBe(1);
  });

  it("returns correct labels", () => {
    const result = buildCurrentStatusEntries([]);
    const labelMap = Object.fromEntries(result.map((e) => [e.key, e.label]));
    expect(labelMap.applying).toBe("Applying");
    expect(labelMap.resume).toBe("Applied");
    expect(labelMap.interview1).toBe("Interview 1");
    expect(labelMap.interview2).toBe("Interview 2");
    expect(labelMap.interview3).toBe("Interview 3");
  });
});

// ── buildCycleEndEntries ──────────────────────────────────────────────────────

describe("buildCycleEndEntries", () => {
  it("returns empty array when no closed jobs", () => {
    const jobs: StatsJobInput[] = [{ status: "applying" }, { status: "resume" }];
    expect(buildCycleEndEntries(jobs)).toEqual([]);
  });

  it("groups closed jobs by cycleEndStage", () => {
    const jobs: StatsJobInput[] = [
      { status: "rejected", cycleEndStage: "interview1" },
      { status: "rejected", cycleEndStage: "interview1" },
      { status: "offer", cycleEndStage: "offer" },
    ];
    const result = buildCycleEndEntries(jobs);
    expect(result.find((e) => e.key === "interview1")?.count).toBe(2);
    expect(result.find((e) => e.key === "offer")?.count).toBe(1);
  });

  it("treats null cycleEndStage as 'applying' (Ended at Applied)", () => {
    const jobs: StatsJobInput[] = [
      { status: "rejected", cycleEndStage: null },
      { status: "rejected", cycleEndStage: null },
    ];
    const result = buildCycleEndEntries(jobs);
    expect(result.find((e) => e.key === "applying")?.count).toBe(2);
    expect(result.find((e) => e.key === "applying")?.label).toBe("Ended at Applied");
  });

  it("uses neutral wording for all labels", () => {
    const jobs: StatsJobInput[] = [
      { status: "rejected", cycleEndStage: "applying" },
      { status: "rejected", cycleEndStage: "resume" },
      { status: "rejected", cycleEndStage: "interview1" },
      { status: "rejected", cycleEndStage: "interview2" },
      { status: "rejected", cycleEndStage: "interview3" },
      { status: "offer", cycleEndStage: "offer" },
    ];
    const result = buildCycleEndEntries(jobs);
    const labelMap = Object.fromEntries(result.map((e) => [e.key, e.label]));
    expect(labelMap.applying).toBe("Ended at Applied");
    expect(labelMap.resume).toBe("Ended at Applied");
    expect(labelMap.interview1).toBe("Ended at Interview 1");
    expect(labelMap.interview2).toBe("Ended at Interview 2");
    expect(labelMap.interview3).toBe("Ended at Interview 3");
    expect(labelMap.offer).toBe("Ended at Offer");
  });

  it("omits stages with zero count", () => {
    const jobs: StatsJobInput[] = [
      { status: "rejected", cycleEndStage: "interview2" },
    ];
    const result = buildCycleEndEntries(jobs);
    expect(result.length).toBe(1);
    expect(result[0].key).toBe("interview2");
  });

  it("respects ORDER: applying < resume < interview1 < interview2 < interview3 < offer", () => {
    const jobs: StatsJobInput[] = [
      { status: "offer", cycleEndStage: "offer" },
      { status: "rejected", cycleEndStage: null }, // → applying
      { status: "rejected", cycleEndStage: "interview1" },
    ];
    const result = buildCycleEndEntries(jobs);
    expect(result.map((e) => e.key)).toEqual(["applying", "interview1", "offer"]);
  });
});

// ── countClosedCycles ─────────────────────────────────────────────────────────

describe("countClosedCycles", () => {
  it("returns 0 for empty input", () => {
    expect(countClosedCycles([])).toBe(0);
  });

  it("counts offer and rejected jobs", () => {
    const jobs: StatsJobInput[] = [
      { status: "applying" },
      { status: "offer" },
      { status: "rejected" },
      { status: "rejected" },
    ];
    expect(countClosedCycles(jobs)).toBe(3);
  });

  it("ignores active jobs", () => {
    const jobs: StatsJobInput[] = [
      { status: "applying" },
      { status: "resume" },
      { status: "interview1" },
    ];
    expect(countClosedCycles(jobs)).toBe(0);
  });
});
