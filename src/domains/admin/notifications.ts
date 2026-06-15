import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@/generated/prisma";

// Re-export a transaction-compatible type so callers can pass their own tx.
type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

// ── Types ────────────────────────────────────────────────────────────────────

export type AdminNotificationType = "new_offer" | "offer_deactivated";

export interface AdminNotificationItem {
  id: string;
  type: string;
  message: string;
  profileId: string | null;
  offerId: string | null;
  createdAt: Date;
  isRead: boolean;
}

// ── Create (designed to run inside an existing transaction) ──────────────────

/**
 * Creates an AdminNotification row. Accepts an optional transaction client
 * so the caller can include this in an existing `prisma.$transaction`.
 * If no tx is provided, uses the global prisma client.
 */
export async function createAdminNotification(
  input: {
    type: AdminNotificationType;
    message: string;
    profileId?: string | null;
    offerId?: string | null;
  },
  tx?: TxClient,
) {
  const client = tx ?? prisma;
  return client.adminNotification.create({
    data: {
      type: input.type,
      message: input.message,
      profileId: input.profileId ?? null,
      offerId: input.offerId ?? null,
    },
  });
}

// ── Read (admin-facing) ─────────────────────────────────────────────────────

/**
 * Returns the count of notifications that the given admin has NOT read.
 */
export async function getUnreadCount(adminId: string): Promise<number> {
  const total = await prisma.adminNotification.count();
  if (total === 0) return 0;

  const readCount = await prisma.adminNotificationRead.count({
    where: { adminId },
  });

  return total - readCount;
}

/**
 * Returns the most recent notifications with a per-admin `isRead` flag.
 */
export async function listNotifications(
  adminId: string,
  limit = 30,
): Promise<AdminNotificationItem[]> {
  const notifications = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      reads: {
        where: { adminId },
        select: { id: true },
      },
    },
  });

  return notifications.map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    profileId: n.profileId,
    offerId: n.offerId,
    createdAt: n.createdAt,
    isRead: n.reads.length > 0,
  }));
}

/**
 * Marks all unread notifications as read for the given admin.
 * Uses upsert-like logic: only creates AdminNotificationRead rows
 * for notifications that the admin has not yet read.
 */
export async function markAllRead(adminId: string): Promise<number> {
  // Find notification IDs the admin has NOT read
  const unread = await prisma.adminNotification.findMany({
    where: {
      reads: { none: { adminId } },
    },
    select: { id: true },
  });

  if (unread.length === 0) return 0;

  // Batch-create read records
  const result = await prisma.adminNotificationRead.createMany({
    data: unread.map((n) => ({
      adminId,
      notificationId: n.id,
    })),
    skipDuplicates: true,
  });

  return result.count;
}

// ── Cleanup ─────────────────────────────────────────────────────────────────

/**
 * Fire-and-forget: deletes notifications older than 90 days.
 * AdminNotificationRead rows are cascade-deleted.
 * This should be called without `await` so it does not block the response.
 */
export function cleanupOldNotifications(): void {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  prisma.adminNotification
    .deleteMany({ where: { createdAt: { lt: cutoff } } })
    .catch(() => {
      // Silently ignore cleanup errors — non-critical background task
    });
}
