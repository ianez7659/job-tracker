import { isAllowedStatusTransition } from "./jobPipeline";

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
