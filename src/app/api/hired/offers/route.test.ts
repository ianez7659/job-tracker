/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    job: { findFirst: jest.fn(), update: jest.fn() },
    hiredProfile: { upsert: jest.fn() },
    hiredOffer: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

// Mock the domain service so route tests don't need full Prisma transaction wiring
jest.mock("@/domains/hired/user-service", () => ({
  createOfferTransition: jest.fn(),
}));

jest.mock("@/lib/xp/service", () => ({
  awardForCycleCompletion: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/xp/rewards", () => ({
  grantsForCycleCompletion: jest.fn().mockReturnValue([{ reason: "CYCLE_COMPLETED", amount: 30 }]),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { createOfferTransition } from "@/domains/hired/user-service";
import { POST } from "./route";

const mockSession = { user: { email: "user@test.com" } };
const mockUser = { id: "user-1" };
const mockJob = {
  id: "job-1",
  title: "Frontend Dev",
  company: "Acme",
  status: "offer",
  appliedAt: new Date("2025-01-01"),
  url: null,
  jd: null,
  cycleEndStage: "interview2",
};
const mockOffer = {
  id: "offer-1",
  hiredProfileId: "profile-1",
  jobId: "job-1",
  offerDate: new Date("2025-06-01"),
  employmentType: "full_time",
  workArrangement: "hybrid",
  salaryRange: "not_disclosed",
  status: "pending",
  verifiedAt: null,
  verifiedByUserId: null,
  deactivatedAt: null,
  deactivatedByUserId: null,
  deactivateReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockProfile = {
  id: "profile-1",
  userId: "user-1",
  followUpDate: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/hired/offers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/hired/offers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest({ jobId: "j1", offerDate: "2025-06-01", employmentType: "full_time" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when user not found in DB", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest({ jobId: "j1", offerDate: "2025-06-01", employmentType: "full_time" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when jobId is missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    const res = await POST(makeRequest({ offerDate: "2025-06-01", employmentType: "full_time" }));
    expect(res.status).toBe(400);
    const data = await res.json() as { message: string };
    expect(data.message).toMatch(/jobId/);
  });

  it("returns 400 when offerDate is missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    const res = await POST(makeRequest({ jobId: "j1", employmentType: "full_time" }));
    expect(res.status).toBe(400);
    const data = await res.json() as { message: string };
    expect(data.message).toMatch(/offerDate/);
  });

  it("returns 400 when employmentType is invalid", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    const res = await POST(makeRequest({ jobId: "j1", offerDate: "2025-06-01", employmentType: "gigwork" }));
    expect(res.status).toBe(400);
    const data = await res.json() as { message: string };
    expect(data.message).toMatch(/employmentType/);
  });

  it("returns 400 when workArrangement is invalid", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    const res = await POST(makeRequest({ jobId: "j1", offerDate: "2025-06-01", employmentType: "full_time", workArrangement: "moon" }));
    expect(res.status).toBe(400);
    const data = await res.json() as { message: string };
    expect(data.message).toMatch(/workArrangement/);
  });

  it("returns 404 when job not found (domain service throws JOB_NOT_FOUND)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    const err = Object.assign(new Error("Job not found"), { code: "JOB_NOT_FOUND" });
    (createOfferTransition as jest.Mock).mockRejectedValue(err);
    const res = await POST(makeRequest({ jobId: "bad-id", offerDate: "2025-06-01", employmentType: "full_time" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when transition not allowed (domain service throws INVALID_TRANSITION)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    const err = Object.assign(new Error('Status transition from "applying" to "offer" is not allowed'), { code: "INVALID_TRANSITION" });
    (createOfferTransition as jest.Mock).mockRejectedValue(err);
    const res = await POST(makeRequest({ jobId: "j1", offerDate: "2025-06-01", employmentType: "full_time" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 with offerId and xpGained on success", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (createOfferTransition as jest.Mock).mockResolvedValue({
      job: mockJob,
      hiredProfile: mockProfile,
      hiredOffer: mockOffer,
    });
    const res = await POST(
      makeRequest({ jobId: "job-1", offerDate: "2025-06-01", employmentType: "full_time", workArrangement: "hybrid" }),
    );
    expect(res.status).toBe(201);
    const data = await res.json() as { offerId: string; xpGained: number };
    expect(data.offerId).toBe("offer-1");
    expect(data.xpGained).toBe(30);
  });

  it("passes optional fields correctly to createOfferTransition", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (createOfferTransition as jest.Mock).mockResolvedValue({
      job: mockJob,
      hiredProfile: mockProfile,
      hiredOffer: mockOffer,
    });
    await POST(
      makeRequest({
        jobId: "job-1",
        offerDate: "2025-06-01",
        employmentType: "contract",
        workArrangement: "remote",
        salaryRange: "60k_70k",
      }),
    );
    expect(createOfferTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        jobId: "job-1",
        employmentType: "contract",
        workArrangement: "remote",
        salaryRange: "60k_70k",
      }),
    );
  });
});
