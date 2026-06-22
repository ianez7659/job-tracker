/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/domains/admin/require-admin", () => ({
  getAdminSession: jest.fn(),
}));

jest.mock("@/domains/admin/activityLog", () => ({
  getActivityLogs: jest.fn(),
}));

import { getAdminSession } from "@/domains/admin/require-admin";
import { getActivityLogs } from "@/domains/admin/activityLog";
import { GET } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
  isSuperAdmin: false,
};

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/admin/activity");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString(), { method: "GET" }) as unknown as Parameters<typeof GET>[0];
}

describe("GET /api/admin/activity", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 200 with activity logs", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (getActivityLogs as jest.Mock).mockResolvedValue({
      entries: [
        {
          id: "log-1",
          adminId: "admin-1",
          adminName: "Ian",
          adminEmail: "admin@test.com",
          action: "offer_verified",
          targetType: "offer",
          targetId: "offer-1",
          metadata: { company: "Acme" },
          createdAt: new Date("2026-06-22T10:00:00Z"),
        },
      ],
      total: 1,
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const data = (await res.json()) as { entries: unknown[]; total: number };
    expect(data.entries).toHaveLength(1);
    expect(data.total).toBe(1);
  });

  it("passes filter params to getActivityLogs", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (getActivityLogs as jest.Mock).mockResolvedValue({ entries: [], total: 0 });

    await GET(makeRequest({
      action: "user_role_changed",
      targetType: "user",
      targetId: "user-5",
      page: "2",
      perPage: "10",
    }));

    expect(getActivityLogs).toHaveBeenCalledWith({
      action: "user_role_changed",
      targetType: "user",
      targetId: "user-5",
      page: 2,
      perPage: 10,
    });
  });

  it("defaults page to 1 and perPage to 20", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (getActivityLogs as jest.Mock).mockResolvedValue({ entries: [], total: 0 });

    await GET(makeRequest());

    expect(getActivityLogs).toHaveBeenCalledWith({
      action: undefined,
      targetType: undefined,
      targetId: undefined,
      page: 1,
      perPage: 20,
    });
  });
});
