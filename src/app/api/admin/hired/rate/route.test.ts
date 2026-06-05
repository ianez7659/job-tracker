/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/domains/admin/require-admin", () => ({
  getAdminSession: jest.fn(),
}));

jest.mock("@/domains/admin/hiredRate", () => ({
  getHiredRateStats: jest.fn(),
  getHiredOfferRows: jest.fn(),
}));

import { getAdminSession } from "@/domains/admin/require-admin";
import { getHiredRateStats, getHiredOfferRows } from "@/domains/admin/hiredRate";
import { GET } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
  isSuperAdmin: false,
};

const MOCK_STATS = {
  totalHired: 3,
  hiredRate: 12.5,
  uniqueCompanies: 3,
  offersThisMonth: 5,
  studentCount: 24,
};

const MOCK_ROWS = [
  {
    profileId: "profile-1",
    offerId: "offer-1",
    userId: "user-1",
    userName: "Alice",
    userEmail: "alice@test.com",
    userCategory: "IT / Tech",
    status: "current_hired",
    company: "Acme",
    title: "Engineer",
    offerDate: new Date("2026-05-28"),
    employmentType: "full_time",
    workArrangement: "hybrid",
    salaryRange: "60k_70k",
    verifiedAt: new Date("2026-06-01"),
    createdAt: new Date("2026-05-28"),
    offerCount: 1,
  },
  {
    profileId: "profile-2",
    offerId: "offer-2",
    userId: "user-2",
    userName: "Bob",
    userEmail: "bob@test.com",
    userCategory: "Hospitality",
    status: "pending",
    company: "Starbucks",
    title: "Barista",
    offerDate: new Date("2026-05-20"),
    employmentType: "part_time",
    workArrangement: null,
    salaryRange: null,
    verifiedAt: null,
    createdAt: new Date("2026-05-20"),
    offerCount: 2,
  },
];

describe("GET /api/admin/hired/rate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with stats and rows on success", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (getHiredRateStats as jest.Mock).mockResolvedValue(MOCK_STATS);
    (getHiredOfferRows as jest.Mock).mockResolvedValue(MOCK_ROWS);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      stats: typeof MOCK_STATS;
      rows: typeof MOCK_ROWS;
    };
    expect(data.stats.totalHired).toBe(3);
    expect(data.stats.hiredRate).toBe(12.5);
    expect(data.stats.uniqueCompanies).toBe(3);
    expect(data.stats.offersThisMonth).toBe(5);
    expect(data.stats.studentCount).toBe(24);
    expect(data.rows).toHaveLength(2);
    expect(data.rows[0].profileId).toBe("profile-1");
    expect(data.rows[0].userCategory).toBe("IT / Tech");
    expect(data.rows[0].offerCount).toBe(1);
    expect(data.rows[1].offerCount).toBe(2);
  });

  it("returns 200 with empty data when no confirmed hires exist", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (getHiredRateStats as jest.Mock).mockResolvedValue({
      totalHired: 0,
      hiredRate: 0,
      uniqueCompanies: 0,
      offersThisMonth: 0,
      studentCount: 24,
    });
    (getHiredOfferRows as jest.Mock).mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      stats: { totalHired: number; hiredRate: number };
      rows: unknown[];
    };
    expect(data.stats.totalHired).toBe(0);
    expect(data.stats.hiredRate).toBe(0);
    expect(data.rows).toHaveLength(0);
  });
});
