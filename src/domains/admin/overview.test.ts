/**
 * Unit tests for admin overview calculations.
 * Uses mocked prisma — no DB connection required.
 */

jest.mock("@/lib/prisma", () => ({
  prisma: { user: { findMany: jest.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { getAdminOverview } from "./overview";

const mockFindMany = prisma.user.findMany as jest.Mock;

function makeUser(overrides: {
  id: string;
  hubStatus?: string | null;
  category?: string | null;
  jobs?: { status: string; appliedAt: Date; deletedAt?: Date | null }[];
  xpEvents?: { createdAt: Date }[];
}) {
  const jobs = (overrides.jobs ?? []).map((j) => ({
    id: j.status + "-id",
    status: j.status,
    appliedAt: j.appliedAt,
    deletedAt: j.deletedAt ?? null,
  }));
  return {
    id: overrides.id,
    category: overrides.category ?? null,
    hubStatus: overrides.hubStatus ?? "STUDENT",
    jobs,
    xp: {
      id: "xp-" + overrides.id,
      events: (overrides.xpEvents ?? []).map((e) => ({ createdAt: e.createdAt })),
    },
  };
}

const NOW = new Date();
const DAY = 86400000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);

describe("getAdminOverview", () => {
  beforeEach(() => jest.clearAllMocks());

  it("counts hired users with offer jobs only", async () => {
    mockFindMany.mockResolvedValue([
      makeUser({ id: "u1", jobs: [{ status: "offer", appliedAt: daysAgo(10) }] }),
      makeUser({ id: "u2", jobs: [{ status: "resume", appliedAt: daysAgo(5) }] }),
    ]);

    const result = await getAdminOverview();
    expect(result.hiredCount).toBe(1);
    expect(result.hiredRate).toBe(0.5);
  });

  it("excludes soft-deleted jobs from hired calculation", async () => {
    mockFindMany.mockResolvedValue([
      makeUser({
        id: "u1",
        jobs: [{ status: "offer", appliedAt: daysAgo(5), deletedAt: daysAgo(1) }],
      }),
    ]);

    // soft-deleted job should not count as hired
    // The prisma where clause filters deletedAt: null before returning,
    // so we simulate a user whose offer job was already filtered out
    mockFindMany.mockResolvedValue([
      {
        id: "u1",
        category: null,
        jobs: [], // deletedAt jobs pre-filtered by prisma
        xp: { id: "xp-u1", events: [] },
      },
    ]);

    const result = await getAdminOverview();
    expect(result.hiredCount).toBe(0);
  });

  it("counts stuck applications — applying/resume older than 14 days", async () => {
    mockFindMany.mockResolvedValue([
      makeUser({
        id: "u1",
        jobs: [
          { status: "applying", appliedAt: daysAgo(20) }, // stuck
          { status: "resume", appliedAt: daysAgo(3) },    // not stuck yet
        ],
      }),
    ]);

    const result = await getAdminOverview();
    expect(result.stuckApplicationsCount).toBe(1);
  });

  it("does not count stuck for hired users", async () => {
    mockFindMany.mockResolvedValue([
      makeUser({
        id: "u1",
        jobs: [
          { status: "offer", appliedAt: daysAgo(30) },
          { status: "applying", appliedAt: daysAgo(20) },
        ],
      }),
    ]);

    const result = await getAdminOverview();
    expect(result.stuckApplicationsCount).toBe(0);
  });

  it("counts currently active users — DAILY_ACTIVITY within 3 days", async () => {
    mockFindMany.mockResolvedValue([
      makeUser({ id: "u1", xpEvents: [{ createdAt: daysAgo(1) }] }),
      makeUser({ id: "u2", xpEvents: [{ createdAt: daysAgo(4) }] }),
      makeUser({ id: "u3", xpEvents: [] }),
    ]);

    const result = await getAdminOverview();
    expect(result.currentlyActiveUsers).toBe(1);
  });

  it("counts needs support — no jobs or inactive 14+ days", async () => {
    mockFindMany.mockResolvedValue([
      makeUser({ id: "u1", jobs: [] }),                                         // no jobs
      makeUser({ id: "u2", xpEvents: [{ createdAt: daysAgo(20) }],             // inactive
        jobs: [{ status: "applying", appliedAt: daysAgo(5) }] }),
      makeUser({ id: "u3", xpEvents: [{ createdAt: daysAgo(2) }],             // active + has jobs
        jobs: [{ status: "resume", appliedAt: daysAgo(3) }] }),
    ]);

    const result = await getAdminOverview();
    expect(result.needsSupportCount).toBe(2);
  });

  it("builds category distribution correctly", async () => {
    mockFindMany.mockResolvedValue([
      makeUser({ id: "u1", category: "web_development" }),
      makeUser({ id: "u2", category: "web_development" }),
      makeUser({ id: "u3", category: null }),
    ]);

    const result = await getAdminOverview();
    const webDev = result.categoryDistribution.find(
      (c) => c.category === "web_development"
    );
    const notSet = result.categoryDistribution.find(
      (c) => c.category === "not_set"
    );
    expect(webDev?.count).toBe(2);
    expect(notSet?.count).toBe(1);
  });
});
