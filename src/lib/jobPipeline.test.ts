import {
  getNextStageLabel,
  getRailNodes,
  isAllowedStatusTransition,
  railPositionLabel,
  statusDisplayLabel,
} from "./jobPipeline";

describe("isAllowedStatusTransition", () => {
  it("allows offer from Applied through interview3", () => {
    expect(isAllowedStatusTransition("resume", "offer")).toBe(true);
    expect(isAllowedStatusTransition("interview1", "offer")).toBe(true);
    expect(isAllowedStatusTransition("interview2", "offer")).toBe(true);
    expect(isAllowedStatusTransition("interview3", "offer")).toBe(true);
  });

  it("does not allow offer from applying", () => {
    expect(isAllowedStatusTransition("applying", "offer")).toBe(false);
  });

  it("does not allow transitions from terminal statuses", () => {
    expect(isAllowedStatusTransition("offer", "resume")).toBe(false);
    expect(isAllowedStatusTransition("rejected", "offer")).toBe(false);
  });
});

describe("statusDisplayLabel", () => {
  it.each([
    ["applying", "Applying"],
    ["resume", "Applied"],
    ["interview1", "Interview 1"],
    ["interview2", "Interview 2"],
    ["interview3", "Interview 3"],
    ["offer", "Offer"],
    ["rejected", "Rejected"],
  ])("shows %s as %s", (status, label) => {
    expect(statusDisplayLabel(status)).toBe(label);
  });

  it("never returns a raw enum for a known stage", () => {
    for (const s of ["applying", "resume", "interview1", "interview2", "interview3"]) {
      expect(statusDisplayLabel(s)).not.toMatch(/^[A-Z0-9]+$|resume|interview\d/);
    }
  });

  it("passes an unknown status through unchanged instead of inventing a label", () => {
    expect(statusDisplayLabel("archived")).toBe("archived");
  });
});

describe("getNextStageLabel", () => {
  it("names the next checkpoint for stages the board can advance", () => {
    expect(getNextStageLabel("resume")).toBe("Interview 1");
    expect(getNextStageLabel("interview1")).toBe("Interview 2");
    expect(getNextStageLabel("interview2")).toBe("Interview 3");
  });

  it("returns null where the next step is not a single stage move", () => {
    // applying → Applied goes through the Apply flow (resume upload).
    expect(getNextStageLabel("applying")).toBeNull();
    // interview3 ends with Offer or Rejected, decided on the detail page.
    expect(getNextStageLabel("interview3")).toBeNull();
    expect(getNextStageLabel("offer")).toBeNull();
    expect(getNextStageLabel("rejected")).toBeNull();
    expect(getNextStageLabel("unknown")).toBeNull();
  });
});

describe("railPositionLabel", () => {
  it("counts open stages out of the six checkpoints", () => {
    expect(railPositionLabel("applying")).toBe("Checkpoint 1 of 6");
    expect(railPositionLabel("interview1")).toBe("Checkpoint 3 of 6");
    expect(railPositionLabel("interview3")).toBe("Checkpoint 5 of 6");
  });

  it("calls an outcome closed and gives nothing for an unknown status", () => {
    expect(railPositionLabel("offer")).toBe("Closed");
    expect(railPositionLabel("rejected")).toBe("Closed");
    expect(railPositionLabel("archived")).toBeNull();
  });
});

describe("getRailNodes", () => {
  const states = (status: string, end?: string | null) =>
    getRailNodes(status, end).map((n) => n.state);

  it("always returns the six checkpoints in order", () => {
    expect(getRailNodes("resume").map((n) => n.key)).toEqual([
      "applying",
      "resume",
      "interview1",
      "interview2",
      "interview3",
      "outcome",
    ]);
    expect(getRailNodes("resume").map((n) => n.label)).toEqual([
      "Applying",
      "Applied",
      "Interview 1",
      "Interview 2",
      "Interview 3",
      "Outcome",
    ]);
  });

  it("marks earlier stages done, the current one current, later ones upcoming", () => {
    expect(states("applying")).toEqual([
      "current", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming",
    ]);
    expect(states("interview2")).toEqual([
      "done", "done", "done", "current", "upcoming", "upcoming",
    ]);
    expect(states("interview3")).toEqual([
      "done", "done", "done", "done", "current", "upcoming",
    ]);
  });

  it("ends an offer cycle at the stage it really reached, without implying skipped rounds", () => {
    const nodes = getRailNodes("offer", "interview1");
    expect(nodes.map((n) => n.state)).toEqual([
      "done", "done", "done", "notReached", "notReached", "offer",
    ]);
    expect(nodes[5].label).toBe("Offer");
  });

  it("shows a rejection after the last reached stage", () => {
    const nodes = getRailNodes("rejected", "resume");
    expect(nodes.map((n) => n.state)).toEqual([
      "done", "done", "notReached", "notReached", "notReached", "rejected",
    ]);
    expect(nodes[5].label).toBe("Rejected");
  });

  it("claims no stage as reached when a closed job has no recorded end stage", () => {
    expect(states("rejected", null)).toEqual([
      "notReached", "notReached", "notReached", "notReached", "notReached", "rejected",
    ]);
  });

  it("ignores an end stage on a job that is still open", () => {
    expect(states("interview1", "interview3")).toEqual(states("interview1"));
  });

  it("treats an unknown status as nothing reached yet", () => {
    expect(states("archived")).toEqual([
      "upcoming", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming",
    ]);
  });
});
