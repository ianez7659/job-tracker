/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/domains/admin/require-admin", () => ({
  getAdminSession: jest.fn(),
}));

jest.mock("@/domains/hired/admin-service", () => ({
  verifyHiredOfferAsAdmin: jest.fn(),
}));

import { getAdminSession } from "@/domains/admin/require-admin";
import { verifyHiredOfferAsAdmin } from "@/domains/hired/admin-service";
import { POST } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
};

const MOCK_OFFER = {
  id: "offer-1",
  hiredProfileId: "profile-1",
  jobId: "job-1",
  offerDate: new Date("2025-06-01"),
  employmentType: "full_time",
  workArrangement: "hybrid",
  salaryRange: "60k_70k",
  status: "current_hired",
  verifiedAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(offerId: string) {
  return {
    req: new Request(`http://localhost/api/admin/hired/offers/${offerId}/verify`, {
      method: "POST",
    }),
    params: Promise.resolve({ offerId }),
  };
}

describe("POST /api/admin/hired/offers/[offerId]/verify", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    const { req, params } = makeRequest("offer-1");
    const res = await POST(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when offer not found", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const err = Object.assign(new Error("Offer not found"), { code: "OFFER_NOT_FOUND" });
    (verifyHiredOfferAsAdmin as jest.Mock).mockRejectedValue(err);
    const { req, params } = makeRequest("bad-id");
    const res = await POST(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns 200 with verified offer on success", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (verifyHiredOfferAsAdmin as jest.Mock).mockResolvedValue(MOCK_OFFER);
    const { req, params } = makeRequest("offer-1");
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    const data = await res.json() as { offer: typeof MOCK_OFFER };
    expect(data.offer.status).toBe("current_hired");
    expect(verifyHiredOfferAsAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ offerId: "offer-1", adminId: "admin-1" }),
    );
  });
});
