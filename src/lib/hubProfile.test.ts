import {
  parseUserProfilePatch,
  USER_PROFILE_LIMITS,
} from "@/lib/hubProfile";

describe("parseUserProfilePatch", () => {
  it("returns empty patch for empty object", () => {
    const r = parseUserProfilePatch({});
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.patch)).toHaveLength(0);
  });

  it("trims and caps name", () => {
    const long = "x".repeat(USER_PROFILE_LIMITS.name + 10);
    const r = parseUserProfilePatch({ name: `  ${long}  ` });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.name?.length).toBe(USER_PROFILE_LIMITS.name);
    }
  });

  it("accepts valid hubStatus", () => {
    const r = parseUserProfilePatch({ hubStatus: "ALUMNI" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.patch.hubStatus).toBe("ALUMNI");
  });

  it("rejects invalid hubStatus", () => {
    const r = parseUserProfilePatch({ hubStatus: "INVALID" });
    expect(r.ok).toBe(false);
  });

  it("allows hubStatus null", () => {
    const r = parseUserProfilePatch({ hubStatus: null });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.patch.hubStatus).toBeNull();
  });

  it("rejects non-object body", () => {
    expect(parseUserProfilePatch(null).ok).toBe(false);
    expect(parseUserProfilePatch([]).ok).toBe(false);
  });
});
