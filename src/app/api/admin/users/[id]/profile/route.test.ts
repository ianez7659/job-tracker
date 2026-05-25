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
    },
  },
}));

import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PATCH } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
};
const TARGET_ID = "user-99";

function makeRequest(body: unknown) {
  return new Request(`http://localhost/api/admin/users/${TARGET_ID}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as import("next/server").NextRequest;
}

const params = Promise.resolve({ id: TARGET_ID });

describe("PATCH /api/admin/users/[id]/profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPER_ADMIN_EMAILS = "admin@test.com";
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: TARGET_ID });
  });

  afterEach(() => {
    delete process.env.SUPER_ADMIN_EMAILS;
  });

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(makeRequest({ category: "web_development" }), { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 when category field is missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const res = await PATCH(makeRequest({ other: "field" }), { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/category field is required/i);
  });

  it("returns 400 when category is an invalid value", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const res = await PATCH(makeRequest({ category: "not_a_real_track" }), { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid category/i);
  });

  it("updates category and invalidates caches on success", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const res = await PATCH(makeRequest({ category: "web_development" }), { params });
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: TARGET_ID },
        data: { category: "web_development" },
      })
    );
    expect(revalidateTag).toHaveBeenCalledWith("admin-users-detailed");
    expect(revalidateTag).toHaveBeenCalledWith("admin-user-detail");
  });

  it("allows clearing category by sending null", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const res = await PATCH(makeRequest({ category: null }), { params });
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { category: null } })
    );
  });

  it("returns 400 for invalid JSON body", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const req = new Request(
      `http://localhost/api/admin/users/${TARGET_ID}/profile`,
      { method: "PATCH", body: "not-json" }
    ) as import("next/server").NextRequest;
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });
});
