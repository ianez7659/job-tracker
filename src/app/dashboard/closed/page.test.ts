/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: { job: { findMany: jest.fn() } },
}));
jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("./Client", () => ({ __esModule: true, default: () => null }));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import ClosedPage from "./page";

describe("ClosedPage query", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fetches terminal-status jobs for the current user without a deletedAt filter", async () => {
    // Reaching a terminal status sets deletedAt (see PATCH /api/jobs/[id]),
    // so the Closed view must NOT filter on deletedAt or it would hide
    // every closed application.
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "user@test.com" },
    });
    (prisma.job.findMany as jest.Mock).mockResolvedValue([]);

    await ClosedPage();

    const call = (prisma.job.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where).toEqual({
      user: { email: "user@test.com" },
      status: { in: ["offer", "rejected"] },
    });
  });
});
