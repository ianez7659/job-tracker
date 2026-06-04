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
  total: 2,
  byStatus: { pending: 1, current_hired: 1 },
  bySalaryRange: { "60k_70k": 1, not_disclosed: 1 },
  byEmploymentType: { full_time: 2 },
  byWorkArrangement: { hybrid: 1, remote: 1 },
};

const MOCK_ROWS = [
  {
    offerId: "offer-1",
    userId: "user-1",
    userName: "Alice",
    userEmail: "alice@test.com",
    company: "Acme",
    title: "Engineer",
    offerDate: new Date("2025-06-01"),
    employmentType: "full_time",
    workArrangement: "hybrid",
    salaryRange: "60k_70k",
    status: "current_hired",
    verifiedAt: new Date("2025-06-10"),
    createdAt: new Date("2025-06-01"),
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
    const data = await res.json() as { stats: typeof MOCK_STATS; rows: typeof MOCK_ROWS };
    expect(data.stats.total).toBe(2);
    expect(data.stats.byStatus.current_hired).toBe(1);
    expect(data.rows).toHaveLength(1);
    expect(data.rows[0].offerId).toBe("offer-1");
  });

  it("returns 200 with empty data when no offers exist", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (getHiredRateStats as jest.Mock).mockResolvedValue({
      total: 0,
      byStatus: {},
      bySalaryRange: {},
      byEmploymentType: {},
      byWorkArrangement: {},
    });
    (getHiredOfferRows as jest.Mock).mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json() as { stats: { total: number }; rows: unknown[] };
    expect(data.stats.total).toBe(0);
    expect(data.rows).toHaveLength(0);
  });
});
