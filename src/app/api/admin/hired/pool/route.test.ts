/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/domains/admin/require-admin", () => ({
  getAdminSession: jest.fn(),
}));

jest.mock("@/domains/admin/hiredPool", () => ({
  getHiredPoolEntries: jest.fn(),
}));

import { getAdminSession } from "@/domains/admin/require-admin";
import { getHiredPoolEntries } from "@/domains/admin/hiredPool";
import { GET } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
};

const MOCK_ENTRIES = [
  {
    profileId: "profile-1",
    userId: "user-1",
    userName: "Alice",
    userEmail: "alice@test.com",
    notes: null,
    followUpDate: null,
    profileCreatedAt: new Date("2025-06-01"),
    offers: [
      {
        offerId: "offer-1",
        jobId: "job-1",
        company: "Acme",
        title: "Engineer",
        offerDate: new Date("2025-06-01"),
        employmentType: "full_time",
        workArrangement: "hybrid",
        salaryRange: "60k_70k",
        status: "pending",
        verifiedAt: null,
        createdAt: new Date("2025-06-01"),
      },
    ],
  },
];

describe("GET /api/admin/hired/pool", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with entries on success", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (getHiredPoolEntries as jest.Mock).mockResolvedValue(MOCK_ENTRIES);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json() as { entries: typeof MOCK_ENTRIES };
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].profileId).toBe("profile-1");
    expect(data.entries[0].offers).toHaveLength(1);
  });

  it("returns 200 with empty entries when no profiles exist", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (getHiredPoolEntries as jest.Mock).mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json() as { entries: unknown[] };
    expect(data.entries).toHaveLength(0);
  });
});
