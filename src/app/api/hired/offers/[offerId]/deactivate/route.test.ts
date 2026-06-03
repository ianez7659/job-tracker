/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
  },
}));
jest.mock("@/domains/hired/user-service", () => ({
  deactivateHiredOffer: jest.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { deactivateHiredOffer } from "@/domains/hired/user-service";
import { PATCH } from "./route";

const mockSession = { user: { email: "user@test.com" } };
const mockUser = { id: "user-1" };

function makeRequest(offerId: string, body: unknown = {}) {
  return {
    req: new Request(`http://localhost/api/hired/offers/${offerId}/deactivate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    params: Promise.resolve({ offerId }),
  };
}

describe("PATCH /api/hired/offers/[offerId]/deactivate", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const { req, params } = makeRequest("offer-1");
    const res = await PATCH(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when user not found in DB", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const { req, params } = makeRequest("offer-1");
    const res = await PATCH(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns 404 when offer not found (OFFER_NOT_FOUND)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    const err = Object.assign(new Error("Offer not found"), { code: "OFFER_NOT_FOUND" });
    (deactivateHiredOffer as jest.Mock).mockRejectedValue(err);
    const { req, params } = makeRequest("bad-id");
    const res = await PATCH(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns 403 when offer belongs to another user (FORBIDDEN)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    const err = Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" });
    (deactivateHiredOffer as jest.Mock).mockRejectedValue(err);
    const { req, params } = makeRequest("offer-1");
    const res = await PATCH(req, { params });
    expect(res.status).toBe(403);
  });

  it("returns 400 when offer is not current_hired (NOT_CURRENT_HIRED)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    const err = Object.assign(
      new Error('Offer status is "pending", not "current_hired"'),
      { code: "NOT_CURRENT_HIRED" },
    );
    (deactivateHiredOffer as jest.Mock).mockRejectedValue(err);
    const { req, params } = makeRequest("offer-1");
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 200 on success", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (deactivateHiredOffer as jest.Mock).mockResolvedValue(undefined);
    const { req, params } = makeRequest("offer-1", { reason: "Got a better offer" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
    expect(deactivateHiredOffer).toHaveBeenCalledWith({
      userId: "user-1",
      offerId: "offer-1",
      reason: "Got a better offer",
    });
  });

  it("passes null reason when body is empty", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (deactivateHiredOffer as jest.Mock).mockResolvedValue(undefined);
    const { req, params } = makeRequest("offer-1", {});
    await PATCH(req, { params });
    expect(deactivateHiredOffer).toHaveBeenCalledWith(
      expect.objectContaining({ reason: null }),
    );
  });
});
