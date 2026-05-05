import { deriveCycleEndStage, hasInterviewStage } from "./cycleStage";

describe("deriveCycleEndStage", () => {
  it("returns the previous stage for each pipeline stage", () => {
    expect(deriveCycleEndStage("applying")).toBe("applying");
    expect(deriveCycleEndStage("resume")).toBe("resume");
    expect(deriveCycleEndStage("interview1")).toBe("interview1");
    expect(deriveCycleEndStage("interview2")).toBe("interview2");
    expect(deriveCycleEndStage("interview3")).toBe("interview3");
  });

  it("returns null when previousStatus is already terminal", () => {
    expect(deriveCycleEndStage("offer")).toBeNull();
    expect(deriveCycleEndStage("rejected")).toBeNull();
  });

  it("returns null for unknown status strings", () => {
    expect(deriveCycleEndStage("unknown_stage")).toBeNull();
    expect(deriveCycleEndStage("")).toBeNull();
  });
});

describe("hasInterviewStage", () => {
  it("returns true for interview stages", () => {
    expect(hasInterviewStage("interview1")).toBe(true);
    expect(hasInterviewStage("interview2")).toBe(true);
    expect(hasInterviewStage("interview3")).toBe(true);
  });

  it("returns false for non-interview stages", () => {
    expect(hasInterviewStage("applying")).toBe(false);
    expect(hasInterviewStage("resume")).toBe(false);
  });

  it("returns false for null or undefined", () => {
    expect(hasInterviewStage(null)).toBe(false);
    expect(hasInterviewStage(undefined)).toBe(false);
  });
});
