import { NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { getUnreadCount, cleanupOldNotifications } from "@/domains/admin/notifications";

/**
 * GET /api/admin/notifications/unread-count
 *
 * Returns the number of unread admin notifications for the current admin.
 * Used for 10-second polling from AdminTopBar.
 *
 * Side effect: triggers fire-and-forget cleanup of 90+ day old notifications.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminId = session.user.id;
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await getUnreadCount(adminId);

  // Fire-and-forget: clean up old notifications (no await)
  cleanupOldNotifications();

  return NextResponse.json({ count });
}
