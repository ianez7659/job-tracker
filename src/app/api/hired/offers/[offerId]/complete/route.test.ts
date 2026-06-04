/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/domains/hired/user-service", () => ({
  completeOfferSelection: jest.fn(),
}));

import { getServerSession } from "next-auth";
import { completeOfferSelection } from "@/domains/hired/user-service";
import { PATCH } from "./route";

const SESSION = { user: { id: "user-1", email: "user@test.com" } };

function makeRequest(offerId: string, body: unknown) {
  return {
    req: new Request(`http://localhost/api/hired/offers/${offerId}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    params: Promise.resolve({ offerId }),
  };
}

describe("PATCH /api/hired/offers/[offerId]/complete", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const { req, params } = makeRequest("offer-1", { offerDate: "2025-06-01", employmentType: "full_time" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 when offerDate is missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    const { req, params } = makeRequest("offer-1", { employmentType: "full_time" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toMatch(/offerDate/);
  });

  it("returns 400 when employmentType is missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    const { req, params } = makeRequest("offer-1", { offerDate: "2025-06-01" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toMatch(/employmentType/);
  });

  it("returns 400 when employmentType is invalid", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    const { req, params } = makeRequest("offer-1", { offerDate: "2025-06-01", employmentType: "gig" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 404 when offer not found", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    const err = Object.assign(new Error("Offer not found"), { code: "OFFER_NOT_FOUND" });
    (completeOfferSelection as jest.Mock).mockRejectedValue(err);
    const { req, params } = makeRequest("bad-id", { offerDate: "2025-06-01", employmentType: "full_time" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns 403 when offer belongs to another user", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    const err = Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" });
    (completeOfferSelection as jest.Mock).mockRejectedValue(err);
    const { req, params } = makeRequest("offer-1", { offerDate: "2025-06-01", employmentType: "full_time" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(403);
  });

  it("returns 200 on success and calls completeOfferSelection with correct args", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    (completeOfferSelection as jest.Mock).mockResolvedValue(undefined);
    const { req, params } = makeRequest("offer-1", {
      offerDate: "2025-06-01",
      employmentType: "full_time",
      workArrangement: "hybrid",
      salaryRange: "60k_70k",
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
    expect(completeOfferSelection).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        offerId: "offer-1",
        employmentType: "full_time",
        workArrangement: "hybrid",
        salaryRange: "60k_70k",
      }),
    );
  });
});
