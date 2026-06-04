/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/domains/admin/require-admin", () => ({
  getAdminSession: jest.fn(),
}));

jest.mock("@/domains/hired/admin-service", () => ({
  adminDeactivateHiredOffer: jest.fn(),
}));

import { getAdminSession } from "@/domains/admin/require-admin";
import { adminDeactivateHiredOffer } from "@/domains/hired/admin-service";
import { POST } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
};

const MOCK_OFFER = {
  id: "offer-1",
  hiredProfileId: "profile-1",
  jobId: "job-1",
  offerDate: null,
  employmentType: null,
  workArrangement: null,
  salaryRange: null,
  status: "inactive",
  verifiedAt: null,
  updatedAt: new Date(),
};

function makeRequest(offerId: string) {
  return {
    req: new Request(`http://localhost/api/admin/hired/offers/${offerId}/admin-deactivate`, {
      method: "POST",
    }),
    params: Promise.resolve({ offerId }),
  };
}

describe("POST /api/admin/hired/offers/[offerId]/admin-deactivate", () => {
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
    (adminDeactivateHiredOffer as jest.Mock).mockRejectedValue(err);
    const { req, params } = makeRequest("bad-id");
    const res = await POST(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns 200 with inactive offer on success", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (adminDeactivateHiredOffer as jest.Mock).mockResolvedValue(MOCK_OFFER);
    const { req, params } = makeRequest("offer-1");
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    const data = await res.json() as { offer: typeof MOCK_OFFER };
    expect(data.offer.status).toBe("inactive");
    expect(adminDeactivateHiredOffer).toHaveBeenCalledWith(
      expect.objectContaining({ offerId: "offer-1", adminId: "admin-1" }),
    );
  });
});
