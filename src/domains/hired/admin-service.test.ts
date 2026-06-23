/**
 * Unit tests for hired admin-service batch functions.
 * Uses mocked prisma — no DB connection required.
 */

jest.mock("@/lib/prisma", () => ({
  prisma: {
    hiredOffer: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/domains/admin/activityLog", () => ({
  createActivityLog: jest.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/prisma";
import {
  batchVerifyHiredOffers,
  batchDeactivateHiredOffers,
  batchMarkUnverifiable,
} from "./admin-service";

const mockFindUnique = prisma.hiredOffer.findUnique as jest.Mock;
const mockUpdate = prisma.hiredOffer.update as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

const ADMIN_ID = "admin-1";

const makeMockOffer = (id: string, profileId = "profile-1") => ({
  id,
  hiredProfileId: profileId,
  jobId: "job-1",
  offerDate: null,
  employmentType: null,
  workArrangement: null,
  salaryRange: null,
  status: "current_hired",
  verifiedAt: new Date(),
  updatedAt: new Date(),
});

// ── batchVerifyHiredOffers ───────────────────────────────────────────────────

describe("batchVerifyHiredOffers", () => {
  beforeEach(() => jest.clearAllMocks());

  it("succeeds for all valid offers", async () => {
    // verifyHiredOfferAsAdmin flow: findUnique → $transaction
    mockFindUnique.mockResolvedValueOnce({ id: "o1", hiredProfileId: "p1" });
    mockTransaction.mockResolvedValueOnce(makeMockOffer("o1", "p1"));

    mockFindUnique.mockResolvedValueOnce({ id: "o2", hiredProfileId: "p2" });
    mockTransaction.mockResolvedValueOnce(makeMockOffer("o2", "p2"));

    const result = await batchVerifyHiredOffers({
      adminId: ADMIN_ID,
      offerIds: ["o1", "o2"],
    });

    expect(result.succeeded).toEqual(["o1", "o2"]);
    expect(result.failed).toHaveLength(0);
  });

  it("reports failure for not-found offers", async () => {
    mockFindUnique.mockResolvedValueOnce(null); // o1 not found

    const result = await batchVerifyHiredOffers({
      adminId: ADMIN_ID,
      offerIds: ["o1"],
    });

    expect(result.succeeded).toHaveLength(0);
    expect(result.failed).toEqual([{ offerId: "o1", reason: "Offer not found" }]);
  });

  it("handles mixed success and failure", async () => {
    // o1 succeeds
    mockFindUnique.mockResolvedValueOnce({ id: "o1", hiredProfileId: "p1" });
    mockTransaction.mockResolvedValueOnce(makeMockOffer("o1", "p1"));
    // o2 not found
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await batchVerifyHiredOffers({
      adminId: ADMIN_ID,
      offerIds: ["o1", "o2"],
    });

    expect(result.succeeded).toEqual(["o1"]);
    expect(result.failed).toEqual([{ offerId: "o2", reason: "Offer not found" }]);
  });
});

// ── batchDeactivateHiredOffers ───────────────────────────────────────────────

describe("batchDeactivateHiredOffers", () => {
  beforeEach(() => jest.clearAllMocks());

  it("succeeds for all valid offers", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "o1" });
    mockUpdate.mockResolvedValueOnce(makeMockOffer("o1"));

    mockFindUnique.mockResolvedValueOnce({ id: "o2" });
    mockUpdate.mockResolvedValueOnce(makeMockOffer("o2"));

    const result = await batchDeactivateHiredOffers({
      adminId: ADMIN_ID,
      offerIds: ["o1", "o2"],
    });

    expect(result.succeeded).toEqual(["o1", "o2"]);
    expect(result.failed).toHaveLength(0);
  });

  it("reports failure for not-found offers", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await batchDeactivateHiredOffers({
      adminId: ADMIN_ID,
      offerIds: ["o1"],
    });

    expect(result.succeeded).toHaveLength(0);
    expect(result.failed).toEqual([{ offerId: "o1", reason: "Offer not found" }]);
  });

  it("handles mixed success and failure", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "o1" });
    mockUpdate.mockResolvedValueOnce(makeMockOffer("o1"));
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await batchDeactivateHiredOffers({
      adminId: ADMIN_ID,
      offerIds: ["o1", "o2"],
    });

    expect(result.succeeded).toEqual(["o1"]);
    expect(result.failed).toEqual([{ offerId: "o2", reason: "Offer not found" }]);
  });
});

// ── batchMarkUnverifiable ────────────────────────────────────────────────────

describe("batchMarkUnverifiable", () => {
  beforeEach(() => jest.clearAllMocks());

  it("succeeds for all valid offers", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "o1" });
    mockUpdate.mockResolvedValueOnce(makeMockOffer("o1"));

    mockFindUnique.mockResolvedValueOnce({ id: "o2" });
    mockUpdate.mockResolvedValueOnce(makeMockOffer("o2"));

    const result = await batchMarkUnverifiable({
      adminId: ADMIN_ID,
      offerIds: ["o1", "o2"],
    });

    expect(result.succeeded).toEqual(["o1", "o2"]);
    expect(result.failed).toHaveLength(0);
  });

  it("reports failure for not-found offers", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await batchMarkUnverifiable({
      adminId: ADMIN_ID,
      offerIds: ["o1"],
    });

    expect(result.succeeded).toHaveLength(0);
    expect(result.failed).toEqual([{ offerId: "o1", reason: "Offer not found" }]);
  });

  it("returns empty succeeded for empty array", async () => {
    const result = await batchMarkUnverifiable({
      adminId: ADMIN_ID,
      offerIds: [],
    });

    expect(result.succeeded).toHaveLength(0);
    expect(result.failed).toHaveLength(0);
  });
});
