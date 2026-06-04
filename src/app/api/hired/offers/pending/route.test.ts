/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: { hiredProfile: { findUnique: jest.fn() } },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

const SESSION = { user: { id: "user-1", email: "user@test.com" } };

const MOCK_PROFILE = {
  offers: [
    {
      id: "offer-1",
      jobId: "job-1",
      offerDate: null,
      employmentType: null,
      status: "pending",
      createdAt: new Date("2025-06-01"),
      job: { company: "Acme", title: "Engineer" },
    },
  ],
};

describe("GET /api/hired/offers/pending", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns empty array when user has no HiredProfile", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    (prisma.hiredProfile.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json() as { offers: unknown[] };
    expect(data.offers).toHaveLength(0);
  });

  it("returns incomplete pending offers", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    (prisma.hiredProfile.findUnique as jest.Mock).mockResolvedValue(MOCK_PROFILE);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json() as { offers: { offerId: string; company: string }[] };
    expect(data.offers).toHaveLength(1);
    expect(data.offers[0].offerId).toBe("offer-1");
    expect(data.offers[0].company).toBe("Acme");
  });

  it("returns empty array when no incomplete pending offers exist", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    (prisma.hiredProfile.findUnique as jest.Mock).mockResolvedValue({ offers: [] });
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json() as { offers: unknown[] };
    expect(data.offers).toHaveLength(0);
  });
});
