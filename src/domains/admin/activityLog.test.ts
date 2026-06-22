/**
 * Unit tests for admin activity log domain functions.
 * Uses mocked prisma — no DB connection required.
 */

jest.mock("@/lib/prisma", () => ({
  prisma: {
    adminActivityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  createActivityLog,
  getActivityLogs,
  cleanupOldActivityLogs,
} from "./activityLog";

const mockCreate = prisma.adminActivityLog.create as jest.Mock;
const mockFindMany = prisma.adminActivityLog.findMany as jest.Mock;
const mockCount = prisma.adminActivityLog.count as jest.Mock;
const mockDeleteMany = prisma.adminActivityLog.deleteMany as jest.Mock;

// ── createActivityLog ────────────────────────────────────────────────────────

describe("createActivityLog", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a log entry with all fields", async () => {
    mockCreate.mockResolvedValueOnce({ id: "log-1" });

    await createActivityLog({
      adminId: "admin-1",
      action: "offer_verified",
      targetType: "offer",
      targetId: "offer-1",
      metadata: { company: "Acme", title: "Engineer" },
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0].data).toEqual({
      adminId: "admin-1",
      action: "offer_verified",
      targetType: "offer",
      targetId: "offer-1",
      metadata: { company: "Acme", title: "Engineer" },
    });
  });

  it("creates a log entry without metadata", async () => {
    mockCreate.mockResolvedValueOnce({ id: "log-2" });

    await createActivityLog({
      adminId: "admin-1",
      action: "user_role_changed",
      targetType: "user",
      targetId: "user-1",
    });

    expect(mockCreate.mock.calls[0][0].data.metadata).toBeUndefined();
  });
});

// ── getActivityLogs ──────────────────────────────────────────────────────────

describe("getActivityLogs", () => {
  beforeEach(() => jest.clearAllMocks());

  const MOCK_LOG = {
    id: "log-1",
    adminId: "admin-1",
    action: "offer_verified",
    targetType: "offer",
    targetId: "offer-1",
    metadata: { company: "Acme" },
    createdAt: new Date("2026-06-22T10:00:00Z"),
    admin: { name: "Ian", email: "ian@test.com" },
  };

  it("returns paginated results with defaults", async () => {
    mockFindMany.mockResolvedValueOnce([MOCK_LOG]);
    mockCount.mockResolvedValueOnce(1);

    const result = await getActivityLogs();

    expect(result.entries).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.entries[0].adminName).toBe("Ian");
    expect(result.entries[0].adminEmail).toBe("ian@test.com");
    expect(result.entries[0].action).toBe("offer_verified");

    // Default pagination: skip 0, take 20
    const findCall = mockFindMany.mock.calls[0][0];
    expect(findCall.skip).toBe(0);
    expect(findCall.take).toBe(20);
    expect(findCall.orderBy).toEqual({ createdAt: "desc" });
  });

  it("applies action filter", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);

    await getActivityLogs({ action: "user_role_changed" });

    const findCall = mockFindMany.mock.calls[0][0];
    expect(findCall.where.action).toBe("user_role_changed");
  });

  it("applies adminId filter", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);

    await getActivityLogs({ adminId: "admin-2" });

    const findCall = mockFindMany.mock.calls[0][0];
    expect(findCall.where.adminId).toBe("admin-2");
  });

  it("applies target filter", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);

    await getActivityLogs({ targetType: "offer", targetId: "offer-5" });

    const findCall = mockFindMany.mock.calls[0][0];
    expect(findCall.where.targetType).toBe("offer");
    expect(findCall.where.targetId).toBe("offer-5");
  });

  it("applies custom pagination", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);

    await getActivityLogs({ page: 3, perPage: 10 });

    const findCall = mockFindMany.mock.calls[0][0];
    expect(findCall.skip).toBe(20);
    expect(findCall.take).toBe(10);
  });

  it("returns empty results when no logs exist", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);

    const result = await getActivityLogs();

    expect(result.entries).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

// ── cleanupOldActivityLogs ───────────────────────────────────────────────────

describe("cleanupOldActivityLogs", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes logs older than the specified days", async () => {
    mockDeleteMany.mockResolvedValueOnce({ count: 5 });

    const count = await cleanupOldActivityLogs(90);

    expect(count).toBe(5);
    expect(mockDeleteMany).toHaveBeenCalledTimes(1);

    const where = mockDeleteMany.mock.calls[0][0].where;
    expect(where.createdAt.lt).toBeInstanceOf(Date);
  });

  it("defaults to 90 days", async () => {
    mockDeleteMany.mockResolvedValueOnce({ count: 0 });

    const now = Date.now();
    await cleanupOldActivityLogs();

    const cutoff = mockDeleteMany.mock.calls[0][0].where.createdAt.lt as Date;
    const daysDiff = (now - cutoff.getTime()) / 86400000;
    expect(daysDiff).toBeGreaterThan(89);
    expect(daysDiff).toBeLessThan(91);
  });
});
