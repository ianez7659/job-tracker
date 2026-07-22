/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: { job: { findMany: jest.fn() } },
}));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("./TrashClient", () => ({ __esModule: true, default: () => null }));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import TrashPage from "./page";

describe("TrashPage query", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows soft-deleted jobs but excludes closed (terminal) ones", async () => {
    // Terminal transitions set deletedAt too, so Trash must exclude offer/rejected
    // or it would duplicate the Closed view.
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "user@test.com" },
    });
    (prisma.job.findMany as jest.Mock).mockResolvedValue([]);

    await TrashPage();

    const call = (prisma.job.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where).toEqual({
      deletedAt: { not: null },
      status: { notIn: ["offer", "rejected"] },
      user: { email: "user@test.com" },
    });
  });
});
