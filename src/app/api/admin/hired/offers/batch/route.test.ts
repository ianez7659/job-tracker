/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/domains/admin/require-admin", () => ({
  getAdminSession: jest.fn(),
}));

jest.mock("@/domains/hired/admin-service", () => ({
  batchVerifyHiredOffers: jest.fn(),
  batchDeactivateHiredOffers: jest.fn(),
  batchMarkUnverifiable: jest.fn(),
}));

import { getAdminSession } from "@/domains/admin/require-admin";
import {
  batchVerifyHiredOffers,
  batchDeactivateHiredOffers,
  batchMarkUnverifiable,
} from "@/domains/hired/admin-service";
import { POST } from "./route";

const STAFF_SESSION = {
  user: { id: "admin-1", email: "admin@test.com", hubStatus: "STAFF" },
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/hired/offers/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/hired/offers/batch", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest({ action: "verify", offerIds: ["o1"] }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid action", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const res = await POST(makeRequest({ action: "delete", offerIds: ["o1"] }));
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toContain("Invalid action");
  });

  it("returns 400 for empty offerIds", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const res = await POST(makeRequest({ action: "verify", offerIds: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-array offerIds", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const res = await POST(makeRequest({ action: "verify", offerIds: "o1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when offerIds exceed max limit", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const ids = Array.from({ length: 51 }, (_, i) => `o${i}`);
    const res = await POST(makeRequest({ action: "verify", offerIds: ids }));
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toContain("Maximum");
  });

  it("calls batchVerifyHiredOffers for verify action", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (batchVerifyHiredOffers as jest.Mock).mockResolvedValue({
      succeeded: ["o1", "o2"],
      failed: [],
    });

    const res = await POST(makeRequest({ action: "verify", offerIds: ["o1", "o2"] }));
    expect(res.status).toBe(200);
    const data = await res.json() as { succeeded: string[]; failed: unknown[] };
    expect(data.succeeded).toEqual(["o1", "o2"]);
    expect(batchVerifyHiredOffers).toHaveBeenCalledWith({
      adminId: "admin-1",
      offerIds: ["o1", "o2"],
    });
  });

  it("calls batchDeactivateHiredOffers for deactivate action", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (batchDeactivateHiredOffers as jest.Mock).mockResolvedValue({
      succeeded: ["o1"],
      failed: [{ offerId: "o2", reason: "Offer not found" }],
    });

    const res = await POST(makeRequest({ action: "deactivate", offerIds: ["o1", "o2"] }));
    expect(res.status).toBe(200);
    const data = await res.json() as { succeeded: string[]; failed: { offerId: string; reason: string }[] };
    expect(data.succeeded).toEqual(["o1"]);
    expect(data.failed).toHaveLength(1);
    expect(batchDeactivateHiredOffers).toHaveBeenCalled();
  });

  it("calls batchMarkUnverifiable for mark_unverifiable action", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    (batchMarkUnverifiable as jest.Mock).mockResolvedValue({
      succeeded: ["o1"],
      failed: [],
    });

    const res = await POST(makeRequest({ action: "mark_unverifiable", offerIds: ["o1"] }));
    expect(res.status).toBe(200);
    expect(batchMarkUnverifiable).toHaveBeenCalledWith({
      adminId: "admin-1",
      offerIds: ["o1"],
    });
  });

  it("returns 400 for invalid JSON body", async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(STAFF_SESSION);
    const req = new Request("http://localhost/api/admin/hired/offers/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
