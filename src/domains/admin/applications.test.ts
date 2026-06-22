/**
 * Unit tests for applications domain functions.
 * Uses mocked prisma — no DB connection required.
 */

jest.mock("@/lib/prisma", () => ({
  prisma: {
    job: { findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
  },
}));

jest.mock("./config", () => ({
  OFFER_STATUS: "offer",
  STUCK_STATUSES: ["applying", "resume"],
  STUCK_THRESHOLD_DAYS: 14,
}));

import { prisma } from "@/lib/prisma";
import {
  getStuckApplications,
  getApplicationsPageForAdmin,
  getPipelineDistribution,
} from "./applications";

const mockJobFindMany = prisma.job.findMany as jest.Mock;
const mockJobCount = prisma.job.count as jest.Mock;
const mockJobGroupBy = prisma.job.groupBy as jest.Mock;

// ── getStuckApplications ─────────────────────────────────────────────────────

describe("getStuckApplications", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns stuck jobs with calculated daysSinceApplied", async () => {
    const appliedDate = new Date();
    appliedDate.setDate(appliedDate.getDate() - 20); // 20 days ago

    // First call: hired users lookup
    mockJobFindMany.mockResolvedValueOnce([]);
    // Second call: stuck jobs
    mockJobFindMany.mockResolvedValueOnce([
      {
        id: "j1",
        title: "Developer",
        company: "Acme",
        status: "applying",
        appliedAt: appliedDate,
        userId: "u1",
        user: { name: "Alice", email: "alice@test.com" },
      },
    ]);

    const result = await getStuckApplications();

    expect(result).toHaveLength(1);
    expect(result[0].jobId).toBe("j1");
    expect(result[0].daysSinceApplied).toBeGreaterThanOrEqual(19);
    expect(result[0].daysSinceApplied).toBeLessThanOrEqual(21);
    expect(result[0].userName).toBe("Alice");
  });

  it("returns empty array when no stuck applications exist", async () => {
    mockJobFindMany.mockResolvedValueOnce([]); // hired users
    mockJobFindMany.mockResolvedValueOnce([]); // stuck jobs

    const result = await getStuckApplications();

    expect(result).toHaveLength(0);
  });

  it("excludes hired users from stuck results", async () => {
    // First call: hired users — u1 is hired
    mockJobFindMany.mockResolvedValueOnce([{ userId: "u1" }]);
    // Second call: stuck jobs query — should exclude u1 via notIn
    mockJobFindMany.mockResolvedValueOnce([]);

    await getStuckApplications();

    const stuckCall = mockJobFindMany.mock.calls[1][0];
    expect(stuckCall.where.userId.notIn).toContain("u1");
  });
});

// ── getApplicationsPageForAdmin ──────────────────────────────────────────────

describe("getApplicationsPageForAdmin", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns paginated results with defaults", async () => {
    const mockJobs = [
      {
        id: "j1", title: "Dev", company: "Acme", status: "applying",
        appliedAt: new Date(), createdAt: new Date(), url: "https://acme.com",
        jd: "description", tags: "react", userId: "u1",
        user: { name: "Alice", email: "alice@test.com", category: "IT / Tech" },
      },
    ];
    mockJobFindMany.mockResolvedValueOnce(mockJobs);
    mockJobCount.mockResolvedValueOnce(1);

    const result = await getApplicationsPageForAdmin();

    expect(result.applications).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.applications[0].jobId).toBe("j1");
    expect(result.applications[0].hasUrl).toBe(true);
    expect(result.applications[0].hasJd).toBe(true);
    expect(result.applications[0].hasNotes).toBe(true);
  });

  it("applies pagination skip and take", async () => {
    mockJobFindMany.mockResolvedValueOnce([]);
    mockJobCount.mockResolvedValueOnce(0);

    await getApplicationsPageForAdmin({ page: 3, perPage: 10 });

    const findCall = mockJobFindMany.mock.calls[0][0];
    expect(findCall.skip).toBe(20); // (3-1) * 10
    expect(findCall.take).toBe(10);
  });

  it("applies status filter", async () => {
    mockJobFindMany.mockResolvedValueOnce([]);
    mockJobCount.mockResolvedValueOnce(0);

    await getApplicationsPageForAdmin({ status: "interview1" });

    const findCall = mockJobFindMany.mock.calls[0][0];
    expect(findCall.where.status).toBe("interview1");
  });

  it("applies search query across company, title, user name, user email", async () => {
    mockJobFindMany.mockResolvedValueOnce([]);
    mockJobCount.mockResolvedValueOnce(0);

    await getApplicationsPageForAdmin({ q: "google" });

    const findCall = mockJobFindMany.mock.calls[0][0];
    expect(findCall.where.OR).toBeDefined();
    expect(findCall.where.OR).toHaveLength(4);
  });

  it("applies track filter for specific category", async () => {
    mockJobFindMany.mockResolvedValueOnce([]);
    mockJobCount.mockResolvedValueOnce(0);

    await getApplicationsPageForAdmin({ track: "IT / Tech" });

    const findCall = mockJobFindMany.mock.calls[0][0];
    expect(findCall.where.user.category).toBe("IT / Tech");
  });

  it("handles __not_set__ track filter", async () => {
    mockJobFindMany.mockResolvedValueOnce([]);
    mockJobCount.mockResolvedValueOnce(0);

    await getApplicationsPageForAdmin({ track: "__not_set__" });

    const findCall = mockJobFindMany.mock.calls[0][0];
    expect(findCall.where.user.category).toBeNull();
  });

  it("maps boolean fields correctly for empty values", async () => {
    const mockJobs = [
      {
        id: "j1", title: "Dev", company: "Acme", status: "applying",
        appliedAt: new Date(), createdAt: new Date(),
        url: null, jd: null, tags: null, userId: "u1",
        user: { name: null, email: "test@test.com", category: null },
      },
    ];
    mockJobFindMany.mockResolvedValueOnce(mockJobs);
    mockJobCount.mockResolvedValueOnce(1);

    const result = await getApplicationsPageForAdmin();

    expect(result.applications[0].hasUrl).toBe(false);
    expect(result.applications[0].hasJd).toBe(false);
    expect(result.applications[0].hasNotes).toBe(false);
    expect(result.applications[0].userName).toBeNull();
  });

  it("sorts by different columns", async () => {
    mockJobFindMany.mockResolvedValueOnce([]);
    mockJobCount.mockResolvedValueOnce(0);

    await getApplicationsPageForAdmin({ sort: "status", dir: "asc" });

    const findCall = mockJobFindMany.mock.calls[0][0];
    expect(findCall.orderBy).toEqual({ status: "asc" });
  });
});

// ── getPipelineDistribution ──────────────────────────────────────────────────

describe("getPipelineDistribution", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns sorted status distribution", async () => {
    mockJobGroupBy.mockResolvedValueOnce([
      { status: "rejected", _count: { _all: 5 } },
      { status: "applying", _count: { _all: 20 } },
      { status: "interview1", _count: { _all: 8 } },
    ]);

    const result = await getPipelineDistribution();

    expect(result).toHaveLength(3);
    // Should be sorted by STATUS_ORDER: applying, interview1, rejected
    expect(result[0].status).toBe("applying");
    expect(result[1].status).toBe("interview1");
    expect(result[2].status).toBe("rejected");
  });

  it("returns empty array when no jobs exist", async () => {
    mockJobGroupBy.mockResolvedValueOnce([]);

    const result = await getPipelineDistribution();

    expect(result).toHaveLength(0);
  });
});
