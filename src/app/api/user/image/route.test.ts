/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@vercel/blob", () => ({
  put: jest.fn(),
  del: jest.fn(),
}));

const { getServerSession } = require("next-auth");

import { POST } from "./route";

describe("POST /api/user/image", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/user/image", { method: "POST" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("blob storage not configured", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "123" } });

    const req = new Request("http://localhost:3000/api/user/image", { method: "POST" });
    const res = await POST(req);

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe("Blob storage not configured");
  });

  it("returns 400 when no file in form", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "123" } });
    const orig = process.env.BLOB_READ_WRITE_TOKEN;
    process.env.BLOB_READ_WRITE_TOKEN = "dummy";

    const form = new FormData();
    const req = new Request("http://localhost:3000/api/user/image", {
      method: "POST",
      body: form,
    });
    const res = await POST(req);

    if (orig !== undefined) process.env.BLOB_READ_WRITE_TOKEN = orig;
    else delete process.env.BLOB_READ_WRITE_TOKEN;

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("No file provided. Use field 'file' or 'image'.");
  });
});
