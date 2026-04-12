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
      update: jest.fn(),
    },
  },
}));

const { getServerSession } = require("next-auth");
import { prisma } from "@/lib/prisma";
import { GET, PATCH } from "./route";

describe("/api/user/profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns user fields", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-1" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      name: "A",
      hubStatus: "STUDENT",
      headline: null,
      category: "web_development",
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.name).toBe("A");
    expect(json.user.hubStatus).toBe("STUDENT");
  });

  it("PATCH returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "Hi" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("PATCH updates user for existing user", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-1" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user-1" });
    (prisma.user.update as jest.Mock).mockResolvedValue({
      name: "Public Name",
      hubStatus: "STUDENT",
      headline: null,
      category: null,
    });

    const req = new Request("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({
        name: "Public Name",
        hubStatus: "STUDENT",
      }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalled();
    const json = await res.json();
    expect(json.user.name).toBe("Public Name");
  });

  it("PATCH returns 400 for invalid hubStatus", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-1" },
    });
    const req = new Request("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ hubStatus: "NOT_A_STATUS" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});
