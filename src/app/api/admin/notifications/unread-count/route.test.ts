/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/domains/admin/require-admin", () => ({
  getAdminSession: jest.fn(),
}));

jest.mock("@/domains/admin/notifications", () => ({
  getUnreadCount: jest.fn(),
  cleanupOldNotifications: jest.fn(),
}));

import { getAdminSession } from "@/domains/admin/require-admin";
import { getUnreadCount, cleanupOldNotifications } from "@/domains/admin/notifications";
import { GET } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
  isSuperAdmin: false,
};

describe("GET /api/admin/notifications/unread-count", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated as admin", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with unread count", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (getUnreadCount as jest.Mock).mockResolvedValue(5);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json() as { count: number };
    expect(data.count).toBe(5);
    expect(getUnreadCount).toHaveBeenCalledWith("admin-1");
  });

  it("triggers fire-and-forget cleanup", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (getUnreadCount as jest.Mock).mockResolvedValue(0);

    await GET();
    expect(cleanupOldNotifications).toHaveBeenCalled();
  });
});
