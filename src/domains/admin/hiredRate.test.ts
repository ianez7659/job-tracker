/**
 * Unit tests for hiredRate domain functions.
 * Uses mocked prisma — no DB connection required.
 */

jest.mock("@/lib/prisma", () => ({
  prisma: {
    hiredProfile: { findMany: jest.fn() },
    hiredOffer: { findMany: jest.fn(), count: jest.fn() },
    user: { count: jest.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getHiredRateStats, getHiredOfferRows } from "./hiredRate";

const mockProfileFindMany = prisma.hiredProfile.findMany as jest.Mock;
const mockOfferFindMany = prisma.hiredOffer.findMany as jest.Mock;
const mockOfferCount = prisma.hiredOffer.count as jest.Mock;
const mockUserCount = prisma.user.count as jest.Mock;

describe("getHiredRateStats", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns correct stats when there are active and cumulative hires", async () => {
    // active profiles (current_hired)
    mockProfileFindMany
      .mockResolvedValueOnce([{ userId: "u1" }, { userId: "u2" }]) // active
      .mockResolvedValueOnce([{ userId: "u1" }, { userId: "u2" }, { userId: "u3" }]); // cumulative
    mockOfferFindMany.mockResolvedValueOnce([
      { job: { company: "Acme" } },
      { job: { company: "Globex" } },
      { job: { company: "Acme" } }, // duplicate company
    ]);
    mockUserCount.mockResolvedValueOnce(20);
    mockOfferCount.mockResolvedValueOnce(5);

    const stats = await getHiredRateStats();

    expect(stats.activeHired).toBe(2);
    expect(stats.cumulativeHired).toBe(3);
    expect(stats.uniqueCompanies).toBe(2); // Acme + Globex
    expect(stats.totalUsers).toBe(20);
    expect(stats.offersThisMonth).toBe(5);
    expect(stats.activeHiredRate).toBe(10); // 2/20 * 100
    expect(stats.cumulativeHiredRate).toBe(15); // 3/20 * 100
  });

  it("returns zeros when no hires exist", async () => {
    mockProfileFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockOfferFindMany.mockResolvedValueOnce([]);
    mockUserCount.mockResolvedValueOnce(10);
    mockOfferCount.mockResolvedValueOnce(0);

    const stats = await getHiredRateStats();

    expect(stats.activeHired).toBe(0);
    expect(stats.cumulativeHired).toBe(0);
    expect(stats.activeHiredRate).toBe(0);
    expect(stats.cumulativeHiredRate).toBe(0);
    expect(stats.uniqueCompanies).toBe(0);
    expect(stats.offersThisMonth).toBe(0);
  });

  it("returns zero rates when totalUsers is 0", async () => {
    mockProfileFindMany
      .mockResolvedValueOnce([{ userId: "u1" }])
      .mockResolvedValueOnce([{ userId: "u1" }]);
    mockOfferFindMany.mockResolvedValueOnce([{ job: { company: "Acme" } }]);
    mockUserCount.mockResolvedValueOnce(0);
    mockOfferCount.mockResolvedValueOnce(1);

    const stats = await getHiredRateStats();

    expect(stats.activeHiredRate).toBe(0);
    expect(stats.cumulativeHiredRate).toBe(0);
  });

  it("accepts custom date range parameters", async () => {
    mockProfileFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockOfferFindMany.mockResolvedValueOnce([]);
    mockUserCount.mockResolvedValueOnce(5);
    mockOfferCount.mockResolvedValueOnce(0);

    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");
    await getHiredRateStats(from, to);

    // offersThisMonth query should use the custom range
    const countCall = mockOfferCount.mock.calls[0][0];
    expect(countCall.where.createdAt.gte).toEqual(from);
    expect(countCall.where.createdAt.lte).toEqual(to);
  });
});

describe("getHiredOfferRows", () => {
  beforeEach(() => jest.clearAllMocks());

  it("picks current_hired as representative offer", async () => {
    mockProfileFindMany.mockResolvedValueOnce([
      {
        id: "p1",
        user: { id: "u1", name: "Alice", email: "alice@test.com", category: "IT / Tech" },
        offers: [
          {
            id: "o1", status: "pending", offerDate: null, employmentType: null,
            workArrangement: null, salaryRange: null, verifiedAt: null,
            createdAt: new Date("2026-06-01"), job: { company: "Acme", title: "Dev" },
          },
          {
            id: "o2", status: "current_hired", offerDate: new Date("2026-06-10"),
            employmentType: "full_time", workArrangement: "hybrid", salaryRange: "60k_70k",
            verifiedAt: new Date("2026-06-12"), createdAt: new Date("2026-06-10"),
            job: { company: "Globex", title: "Engineer" },
          },
        ],
      },
    ]);

    const rows = await getHiredOfferRows();

    expect(rows).toHaveLength(1);
    expect(rows[0].offerId).toBe("o2"); // current_hired picked
    expect(rows[0].company).toBe("Globex");
    expect(rows[0].offerCount).toBe(2);
    expect(rows[0].userCategory).toBe("IT / Tech");
  });

  it("picks newest pending when no current_hired exists", async () => {
    mockProfileFindMany.mockResolvedValueOnce([
      {
        id: "p1",
        user: { id: "u1", name: "Bob", email: "bob@test.com", category: null },
        offers: [
          {
            id: "o1", status: "pending", offerDate: null, employmentType: null,
            workArrangement: null, salaryRange: null, verifiedAt: null,
            createdAt: new Date("2026-05-01"), job: { company: "OldCo", title: "Jr Dev" },
          },
          {
            id: "o2", status: "pending", offerDate: null, employmentType: null,
            workArrangement: null, salaryRange: null, verifiedAt: null,
            createdAt: new Date("2026-06-01"), job: { company: "NewCo", title: "Sr Dev" },
          },
        ],
      },
    ]);

    const rows = await getHiredOfferRows();

    expect(rows[0].offerId).toBe("o2"); // newer pending
    expect(rows[0].company).toBe("NewCo");
  });

  it("falls back to newest offer when no current_hired or pending", async () => {
    mockProfileFindMany.mockResolvedValueOnce([
      {
        id: "p1",
        user: { id: "u1", name: "Carol", email: "carol@test.com", category: null },
        offers: [
          {
            id: "o1", status: "inactive", offerDate: null, employmentType: null,
            workArrangement: null, salaryRange: null, verifiedAt: null,
            createdAt: new Date("2026-03-01"), job: { company: "Alpha", title: "Dev" },
          },
          {
            id: "o2", status: "not_selected", offerDate: null, employmentType: null,
            workArrangement: null, salaryRange: null, verifiedAt: null,
            createdAt: new Date("2026-04-01"), job: { company: "Beta", title: "Dev" },
          },
        ],
      },
    ]);

    const rows = await getHiredOfferRows();

    expect(rows[0].offerId).toBe("o2"); // newest by createdAt
  });

  it("excludes profiles with no offers", async () => {
    mockProfileFindMany.mockResolvedValueOnce([
      {
        id: "p1",
        user: { id: "u1", name: "Dan", email: "dan@test.com", category: null },
        offers: [],
      },
    ]);

    const rows = await getHiredOfferRows();

    expect(rows).toHaveLength(0);
  });

  it("returns empty array when no profiles exist", async () => {
    mockProfileFindMany.mockResolvedValueOnce([]);

    const rows = await getHiredOfferRows();

    expect(rows).toHaveLength(0);
  });
});
