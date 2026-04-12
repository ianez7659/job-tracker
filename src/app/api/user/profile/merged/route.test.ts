/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const { getServerSession } = require("next-auth");
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

describe("GET /api/user/profile/merged", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns merged shape", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "u1" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "u1",
      name: "N",
      image: null,
      category: "web_development",
      hubStatus: "STUDENT",
      headline: "Hi",
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.merged.userId).toBe("u1");
    expect(json.merged.displayName).toBe("N");
    expect(json.merged.communityDisplayLine).toBeTruthy();
    expect(json.merged.hubStatus).toBe("STUDENT");
  });
});
