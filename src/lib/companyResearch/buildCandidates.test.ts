import { buildCandidates } from "./buildCandidates";

describe("buildCandidates", () => {
  it("adds high-confidence candidate from corporate email in jd", () => {
    const r = buildCandidates({
      companyName: "Acme Corp",
      jd: "Email: hr@acme.com",
    });
    expect(r.candidates.length).toBeGreaterThanOrEqual(1);
    const hi = r.candidates.find((c) => c.primaryDomain === "acme.com");
    expect(hi?.confidence).toBe("high");
    expect(r.derivedEmailDomain).toBe("acme.com");
  });

  it("returns low-confidence single row when only gmail", () => {
    const r = buildCandidates({
      companyName: "Unknown Co",
      jd: "Email: me@gmail.com",
    });
    expect(r.candidates).toHaveLength(1);
    expect(r.candidates[0]?.confidence).toBe("low");
    expect(r.candidates[0]?.primaryDomain).toBeNull();
  });
});
