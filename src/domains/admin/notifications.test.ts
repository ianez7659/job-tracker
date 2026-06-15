/**
 * Unit tests for admin notification domain functions.
 * Uses mocked prisma — no DB connection required.
 */

jest.mock("@/lib/prisma", () => ({
  prisma: {
    adminNotification: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    adminNotificationRead: {
      count: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  createAdminNotification,
  getUnreadCount,
  listNotifications,
  markAllRead,
  cleanupOldNotifications,
} from "./notifications";

const mockNotifCreate = prisma.adminNotification.create as jest.Mock;
const mockNotifCount = prisma.adminNotification.count as jest.Mock;
const mockNotifFindMany = prisma.adminNotification.findMany as jest.Mock;
const mockNotifDeleteMany = prisma.adminNotification.deleteMany as jest.Mock;
const mockReadCount = prisma.adminNotificationRead.count as jest.Mock;
const mockReadCreateMany = prisma.adminNotificationRead.createMany as jest.Mock;

describe("createAdminNotification", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a notification using the global prisma client when no tx provided", async () => {
    const created = { id: "n1", type: "new_offer", message: "Test", profileId: null, offerId: null, createdAt: new Date() };
    mockNotifCreate.mockResolvedValue(created);

    const result = await createAdminNotification({
      type: "new_offer",
      message: "Test",
    });

    expect(result).toBe(created);
    expect(mockNotifCreate).toHaveBeenCalledWith({
      data: {
        type: "new_offer",
        message: "Test",
        profileId: null,
        offerId: null,
      },
    });
  });

  it("uses transaction client when tx is provided", async () => {
    const txCreate = jest.fn().mockResolvedValue({ id: "n2" });
    const tx = { adminNotification: { create: txCreate } };

    await createAdminNotification(
      { type: "offer_deactivated", message: "Deactivated", profileId: "p1", offerId: "o1" },
      tx as never,
    );

    expect(txCreate).toHaveBeenCalledWith({
      data: {
        type: "offer_deactivated",
        message: "Deactivated",
        profileId: "p1",
        offerId: "o1",
      },
    });
    expect(mockNotifCreate).not.toHaveBeenCalled();
  });
});

describe("getUnreadCount", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 0 when there are no notifications", async () => {
    mockNotifCount.mockResolvedValue(0);

    const count = await getUnreadCount("admin-1");
    expect(count).toBe(0);
    expect(mockReadCount).not.toHaveBeenCalled();
  });

  it("returns total minus read count", async () => {
    mockNotifCount.mockResolvedValue(10);
    mockReadCount.mockResolvedValue(3);

    const count = await getUnreadCount("admin-1");
    expect(count).toBe(7);
    expect(mockReadCount).toHaveBeenCalledWith({ where: { adminId: "admin-1" } });
  });

  it("returns 0 when all notifications are read", async () => {
    mockNotifCount.mockResolvedValue(5);
    mockReadCount.mockResolvedValue(5);

    const count = await getUnreadCount("admin-1");
    expect(count).toBe(0);
  });
});

describe("listNotifications", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns notifications with isRead flag", async () => {
    mockNotifFindMany.mockResolvedValue([
      { id: "n1", type: "new_offer", message: "Offer A", profileId: "p1", offerId: "o1", createdAt: new Date(), reads: [{ id: "r1" }] },
      { id: "n2", type: "offer_deactivated", message: "Deactivated B", profileId: "p2", offerId: "o2", createdAt: new Date(), reads: [] },
    ]);

    const result = await listNotifications("admin-1");

    expect(result).toHaveLength(2);
    expect(result[0].isRead).toBe(true);
    expect(result[1].isRead).toBe(false);
    expect(mockNotifFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        reads: { where: { adminId: "admin-1" }, select: { id: true } },
      },
    });
  });

  it("respects custom limit", async () => {
    mockNotifFindMany.mockResolvedValue([]);

    await listNotifications("admin-1", 10);
    expect(mockNotifFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }),
    );
  });
});

describe("markAllRead", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 0 when no unread notifications", async () => {
    mockNotifFindMany.mockResolvedValue([]);

    const count = await markAllRead("admin-1");
    expect(count).toBe(0);
    expect(mockReadCreateMany).not.toHaveBeenCalled();
  });

  it("creates read records for unread notifications", async () => {
    mockNotifFindMany.mockResolvedValue([{ id: "n1" }, { id: "n2" }]);
    mockReadCreateMany.mockResolvedValue({ count: 2 });

    const count = await markAllRead("admin-1");
    expect(count).toBe(2);
    expect(mockReadCreateMany).toHaveBeenCalledWith({
      data: [
        { adminId: "admin-1", notificationId: "n1" },
        { adminId: "admin-1", notificationId: "n2" },
      ],
      skipDuplicates: true,
    });
  });
});

describe("cleanupOldNotifications", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls deleteMany with 90-day cutoff and does not throw on error", () => {
    mockNotifDeleteMany.mockRejectedValue(new Error("db error"));

    // Should not throw — fire-and-forget
    expect(() => cleanupOldNotifications()).not.toThrow();
    expect(mockNotifDeleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    });
  });
});
