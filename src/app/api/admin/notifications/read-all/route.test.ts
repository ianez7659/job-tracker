/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/domains/admin/require-admin", () => ({
  getAdminSession: jest.fn(),
}));

jest.mock("@/domains/admin/notifications", () => ({
  markAllRead: jest.fn(),
}));

import { getAdminSession } from "@/domains/admin/require-admin";
import { markAllRead } from "@/domains/admin/notifications";
import { POST } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
  isSuperAdmin: false,
};

describe("POST /api/admin/notifications/read-all", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated as admin", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("returns 200 with count of marked-read notifications", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (markAllRead as jest.Mock).mockResolvedValue(4);

    const res = await POST();
    expect(res.status).toBe(200);
    const data = await res.json() as { markedRead: number };
    expect(data.markedRead).toBe(4);
    expect(markAllRead).toHaveBeenCalledWith("admin-1");
  });
});
