/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/domains/admin/require-admin", () => ({
  getAdminSession: jest.fn(),
}));

jest.mock("@/domains/admin/notifications", () => ({
  listNotifications: jest.fn(),
}));

import { getAdminSession } from "@/domains/admin/require-admin";
import { listNotifications } from "@/domains/admin/notifications";
import { GET } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
  isSuperAdmin: false,
};

describe("GET /api/admin/notifications", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated as admin", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 401 when session has no user id", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue({
      user: { id: undefined, email: "admin@test.com" },
    });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with notifications list", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const mockNotifications = [
      { id: "n1", type: "new_offer", message: "Test offer", profileId: "p1", offerId: "o1", createdAt: new Date(), isRead: false },
    ];
    (listNotifications as jest.Mock).mockResolvedValue(mockNotifications);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.notifications).toHaveLength(1);
    expect(listNotifications).toHaveBeenCalledWith("admin-1");
  });
});
