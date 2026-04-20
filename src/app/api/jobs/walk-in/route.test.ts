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
    job: {
      create: jest.fn(),
    },
  },
}));

const { getServerSession } = require("next-auth");
import { prisma } from "@/lib/prisma";
import { JobSource } from "@/generated/prisma";
import { POST } from "./route";

describe("POST /api/jobs/walk-in", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/jobs/walk-in", {
      method: "POST",
      body: JSON.stringify({ title: "Entry", company: "Store" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when title/company missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "u@test.com" },
    });
    const req = new Request("http://localhost/api/jobs/walk-in", {
      method: "POST",
      body: JSON.stringify({ title: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates walk-in job with defaults", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "u@test.com" },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1" });
    (prisma.job.create as jest.Mock).mockResolvedValue({
      id: "j1",
      title: "Entry",
      company: "Store",
      status: "resume",
    });
    const req = new Request("http://localhost/api/jobs/walk-in", {
      method: "POST",
      body: JSON.stringify({
        title: "Entry",
        company: "Store",
        notes: "From card",
        nextAction: "Call tomorrow",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prisma.job.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: JobSource.WALK_IN,
          status: "resume",
        }),
      }),
    );
    const json = await res.json();
    expect(json.job.id).toBe("j1");
  });
});
