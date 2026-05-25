/**
 * @jest-environment node
 */
jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { PATCH } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
};
const TARGET_ID = "user-99";

function makeRequest(body: unknown) {
  return new Request(`http://localhost/api/admin/users/${TARGET_ID}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as import("next/server").NextRequest;
}

const params = Promise.resolve({ id: TARGET_ID });

describe("PATCH /api/admin/users/[id]/role", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Make the default STAFF_SESSION email a super admin
    process.env.SUPER_ADMIN_EMAILS = "admin@test.com";
  });

  afterEach(() => {
    delete process.env.SUPER_ADMIN_EMAILS;
  });

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(makeRequest({ hubStatus: "ALUMNI" }), { params });
    expect(res.status).toBe(401);
  });

  it("returns 401 when user is not STAFF", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "student-1", hubStatus: "STUDENT" },
    });
    const res = await PATCH(makeRequest({ hubStatus: "ALUMNI" }), { params });
    expect(res.status).toBe(401);
  });

  it("returns 403 when STAFF is not a super admin", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-2", email: "other-staff@test.com", hubStatus: "STAFF" },
    });
    const res = await PATCH(makeRequest({ hubStatus: "ALUMNI" }), { params });
    expect(res.status).toBe(403);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns 403 when super admin tries to change own role", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: TARGET_ID, email: "admin@test.com", hubStatus: "STAFF" },
    });
    const res = await PATCH(makeRequest({ hubStatus: "STUDENT" }), { params });
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid hubStatus value", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const res = await PATCH(makeRequest({ hubStatus: "SUPERADMIN" }), { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing hubStatus", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const res = await PATCH(makeRequest({}), { params });
    expect(res.status).toBe(400);
  });

  it("updates hubStatus and returns updated user on success", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (prisma.user.count as jest.Mock).mockResolvedValue(3);
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: TARGET_ID,
      email: "user@test.com",
      hubStatus: "ALUMNI",
    });

    const res = await PATCH(makeRequest({ hubStatus: "ALUMNI" }), { params });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.hubStatus).toBe("ALUMNI");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: TARGET_ID },
        data: { hubStatus: "ALUMNI" },
      })
    );
  });

  it("returns 403 when removing the last STAFF account", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (prisma.user.count as jest.Mock).mockResolvedValue(1);

    const res = await PATCH(makeRequest({ hubStatus: "STUDENT" }), { params });
    expect(res.status).toBe(403);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
