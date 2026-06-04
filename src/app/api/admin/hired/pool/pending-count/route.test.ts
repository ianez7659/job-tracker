/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/domains/admin/require-admin", () => ({
  getAdminSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: { hiredOffer: { count: jest.fn() } },
}));

import { getAdminSession } from "@/domains/admin/require-admin";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
  isSuperAdmin: false,
};

describe("GET /api/admin/hired/pool/pending-count", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated as admin", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with count of complete pending offers", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (prisma.hiredOffer.count as jest.Mock).mockResolvedValue(3);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json() as { count: number };
    expect(data.count).toBe(3);
    expect(prisma.hiredOffer.count).toHaveBeenCalledWith({
      where: {
        status: "pending",
        offerDate: { not: null },
        employmentType: { not: null },
      },
    });
  });

  it("returns 200 with count 0 when no pending offers", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (prisma.hiredOffer.count as jest.Mock).mockResolvedValue(0);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json() as { count: number };
    expect(data.count).toBe(0);
  });
});
