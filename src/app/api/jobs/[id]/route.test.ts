/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    job: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/jobPipeline", () => ({
  isAllowedStatusTransition: jest.fn(),
}));

jest.mock("@/lib/xp/cycleStage", () => ({
  deriveCycleEndStage: jest.fn(),
}));

jest.mock("@/lib/xp/service", () => ({
  awardForCycleCompletion: jest.fn(),
  awardDailyActivity: jest.fn(),
}));

jest.mock("@/lib/xp/rewards", () => ({
  grantsForCycleCompletion: jest.fn(() => []),
}));

import { getServerSession } from "next-auth";
import { PATCH } from "./route";

const SESSION = {
  user: { email: "user@test.com" },
};

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/jobs/job-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/jobs/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when body.status is 'offer' (status-only)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    const req = makeRequest({ status: "offer" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "job-1" }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/Use \/api\/hired\/offers/);
  });

  it("returns 400 when body.status is 'offer' (full-body)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    const req = makeRequest({
      title: "Dev",
      company: "Acme",
      status: "offer",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "job-1" }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/Use \/api\/hired\/offers/);
  });

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const req = makeRequest({ status: "resume" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "job-1" }) });
    expect(res.status).toBe(401);
  });
});
