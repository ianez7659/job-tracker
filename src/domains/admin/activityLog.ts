import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export type ActivityAction =
  | "offer_verified"
  | "offer_deactivated"
  | "offer_marked_unverifiable"
  | "offer_details_updated"
  | "profile_notes_updated"
  | "user_role_changed"
  | "user_category_changed";

export type ActivityTargetType = "offer" | "profile" | "user";

export type CreateActivityLogInput = {
  adminId: string;
  action: ActivityAction;
  targetType: ActivityTargetType;
  targetId: string;
  metadata?: Record<string, unknown>;
};

export type ActivityLogEntry = {
  id: string;
  adminId: string;
  adminName: string | null;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: unknown;
  createdAt: Date;
};

export type ActivityLogFilter = {
  action?: string;
  adminId?: string;
  targetType?: string;
  targetId?: string;
  page?: number;
  perPage?: number;
};

export type ActivityLogPage = {
  entries: ActivityLogEntry[];
  total: number;
};

// ── Create ───────────────────────────────────────────────────────────────────

/**
 * Insert a single activity log entry.
 * Designed to be called fire-and-forget so failures never block the main operation.
 */
export async function createActivityLog(
  input: CreateActivityLogInput,
): Promise<void> {
  await prisma.adminActivityLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}

// ── Query ────────────────────────────────────────────────────────────────────

/**
 * Paginated, filterable query for activity logs.
 * Returns entries with admin name/email joined.
 */
export async function getActivityLogs(
  filter: ActivityLogFilter = {},
): Promise<ActivityLogPage> {
  const {
    action,
    adminId,
    targetType,
    targetId,
    page = 1,
    perPage = 20,
  } = filter;

  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (adminId) where.adminId = adminId;
  if (targetType) where.targetType = targetType;
  if (targetId) where.targetId = targetId;

  const [logs, total] = await Promise.all([
    prisma.adminActivityLog.findMany({
      where,
      select: {
        id: true,
        adminId: true,
        action: true,
        targetType: true,
        targetId: true,
        metadata: true,
        createdAt: true,
        admin: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.adminActivityLog.count({ where }),
  ]);

  return {
    entries: logs.map((l) => ({
      id: l.id,
      adminId: l.adminId,
      adminName: l.admin.name,
      adminEmail: l.admin.email,
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId,
      metadata: l.metadata,
      createdAt: l.createdAt,
    })),
    total,
  };
}

// ── Cleanup ──────────────────────────────────────────────────────────────────

/**
 * Delete activity logs older than the specified number of days.
 * Default: 90 days. Designed for periodic cleanup (e.g. cron or piggyback).
 */
export async function cleanupOldActivityLogs(days = 90): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await prisma.adminActivityLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return result.count;
}
