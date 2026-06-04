/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/domains/admin/require-admin", () => ({
  getAdminSession: jest.fn(),
}));

jest.mock("@/domains/hired/admin-service", () => ({
  updateHiredProfileNotes: jest.fn(),
}));

import { getAdminSession } from "@/domains/admin/require-admin";
import { updateHiredProfileNotes } from "@/domains/hired/admin-service";
import { PATCH } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
};

function makeRequest(profileId: string, body: unknown) {
  return {
    req: new Request(`http://localhost/api/admin/hired/profile/${profileId}/notes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    params: Promise.resolve({ profileId }),
  };
}

describe("PATCH /api/admin/hired/profile/[profileId]/notes", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    const { req, params } = makeRequest("profile-1", { notes: "hello" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 when notes field is missing", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const { req, params } = makeRequest("profile-1", {});
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 when notes is not a string or null", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const { req, params } = makeRequest("profile-1", { notes: 123 });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 404 when profile not found", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const err = Object.assign(new Error("Profile not found"), { code: "PROFILE_NOT_FOUND" });
    (updateHiredProfileNotes as jest.Mock).mockRejectedValue(err);
    const { req, params } = makeRequest("bad-id", { notes: "test" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns 200 with updated profile on success (string notes)", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (updateHiredProfileNotes as jest.Mock).mockResolvedValue({
      id: "profile-1",
      notes: "Great candidate",
      updatedAt: new Date(),
    });
    const { req, params } = makeRequest("profile-1", { notes: "Great candidate" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
    const data = await res.json() as { profile: { notes: string } };
    expect(data.profile.notes).toBe("Great candidate");
  });

  it("returns 200 when notes is null (clear notes)", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (updateHiredProfileNotes as jest.Mock).mockResolvedValue({
      id: "profile-1",
      notes: null,
      updatedAt: new Date(),
    });
    const { req, params } = makeRequest("profile-1", { notes: null });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
    expect(updateHiredProfileNotes).toHaveBeenCalledWith(
      expect.objectContaining({ notes: null }),
    );
  });
});
