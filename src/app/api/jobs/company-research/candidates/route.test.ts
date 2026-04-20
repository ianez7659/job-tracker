/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from "next-auth";
import { POST } from "./route";

describe("POST /api/jobs/company-research/candidates", () => {
  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/jobs/company-research/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName: "Acme" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns candidates when authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "u@test.com" },
    });
    const req = new Request("http://localhost/api/jobs/company-research/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "Acme",
        jd: "x@acme.com",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { candidates: { candidateId: string }[] };
    expect(Array.isArray(json.candidates)).toBe(true);
    expect(json.candidates.length).toBeGreaterThan(0);
  });
});
