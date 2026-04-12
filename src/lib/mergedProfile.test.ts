import { buildMergedPublicProfile } from "./mergedProfile";

describe("buildMergedPublicProfile", () => {
  const baseUser = {
    id: "u1",
    name: "Legal Name",
    image: null as string | null,
    category: "web_development" as string | null,
    hubStatus: null as "STUDENT" | "ALUMNI" | "STAFF" | null,
    headline: null as string | null,
  };

  it("uses displayName from user.name", () => {
    const m = buildMergedPublicProfile(baseUser);
    expect(m.displayName).toBe("Legal Name");
  });

  it("falls back to null displayName when name empty", () => {
    const m = buildMergedPublicProfile({ ...baseUser, name: "   " });
    expect(m.displayName).toBeNull();
  });

  it("communityDisplayLine is category label when category set", () => {
    const m = buildMergedPublicProfile(baseUser);
    expect(m.communityDisplayLine).toBe("Web Development");
  });

  it("communityDisplayLine is null when no category", () => {
    const m = buildMergedPublicProfile({ ...baseUser, category: null });
    expect(m.communityDisplayLine).toBeNull();
  });

  it("includes headline and hubStatus", () => {
    const m = buildMergedPublicProfile({
      ...baseUser,
      headline: "Hello",
      hubStatus: "STUDENT",
    });
    expect(m.headline).toBe("Hello");
    expect(m.hubStatus).toBe("STUDENT");
  });
});
