/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/domains/admin/require-admin", () => ({
  getAdminSession: jest.fn(),
}));

jest.mock("@/domains/hired/admin-service", () => ({
  updateHiredOfferDetails: jest.fn(),
}));

import { getServerSession } from "next-auth";
import { getAdminSession } from "@/domains/admin/require-admin";
import { updateHiredOfferDetails } from "@/domains/hired/admin-service";
import { PATCH } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
  isSuperAdmin: false,
};

const MOCK_OFFER = {
  id: "offer-1",
  hiredProfileId: "profile-1",
  jobId: "job-1",
  offerDate: new Date("2025-06-01"),
  employmentType: "full_time",
  workArrangement: "hybrid",
  salaryRange: "60k_70k",
  status: "pending",
  verifiedAt: null,
  updatedAt: new Date(),
};

function makeRequest(offerId: string, body: unknown) {
  return {
    req: new Request(`http://localhost/api/admin/hired/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    params: Promise.resolve({ offerId }),
  };
}

describe("PATCH /api/admin/hired/offers/[offerId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    const { req, params } = makeRequest("offer-1", { employmentType: "full_time" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 401 when user is not STAFF (getAdminSession returns null for non-STAFF)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "u1", email: "student@test.com", hubStatus: "STUDENT" },
    });
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    const { req, params } = makeRequest("offer-1", { employmentType: "full_time" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid employmentType", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const { req, params } = makeRequest("offer-1", { employmentType: "gigwork" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toMatch(/employmentType/);
  });

  it("returns 400 for invalid workArrangement", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const { req, params } = makeRequest("offer-1", { workArrangement: "moon" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toMatch(/workArrangement/);
  });

  it("returns 400 for invalid salaryRange", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const { req, params } = makeRequest("offer-1", { salaryRange: "million_plus" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toMatch(/salaryRange/);
  });

  it("returns 400 for invalid offerDate", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const { req, params } = makeRequest("offer-1", { offerDate: "not-a-date" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toMatch(/offerDate/);
  });

  it("returns 404 when offer not found (OFFER_NOT_FOUND)", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const err = Object.assign(new Error("Offer not found"), { code: "OFFER_NOT_FOUND" });
    (updateHiredOfferDetails as jest.Mock).mockRejectedValue(err);
    const { req, params } = makeRequest("bad-id", { employmentType: "full_time" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns 200 with updated offer on success", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (updateHiredOfferDetails as jest.Mock).mockResolvedValue(MOCK_OFFER);
    const { req, params } = makeRequest("offer-1", {
      employmentType: "full_time",
      workArrangement: "hybrid",
      salaryRange: "60k_70k",
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
    const data = await res.json() as { offer: typeof MOCK_OFFER };
    expect(data.offer.id).toBe("offer-1");
  });

  it("only passes supplied fields to updateHiredOfferDetails", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (updateHiredOfferDetails as jest.Mock).mockResolvedValue(MOCK_OFFER);
    const { req, params } = makeRequest("offer-1", { salaryRange: "80k_plus" });
    await PATCH(req, { params });
    expect(updateHiredOfferDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        offerId: "offer-1",
        salaryRange: "80k_plus",
      }),
    );
    // employmentType was NOT supplied — should not be in the call
    const callArg = (updateHiredOfferDetails as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect("employmentType" in callArg).toBe(false);
  });

  it("allows null to clear a field (e.g. offerDate: null)", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (updateHiredOfferDetails as jest.Mock).mockResolvedValue({ ...MOCK_OFFER, offerDate: null });
    const { req, params } = makeRequest("offer-1", { offerDate: null });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
    expect(updateHiredOfferDetails).toHaveBeenCalledWith(
      expect.objectContaining({ offerDate: null }),
    );
  });
});
