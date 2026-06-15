import { NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { markAllRead } from "@/domains/admin/notifications";

/**
 * POST /api/admin/notifications/read-all
 *
 * Marks all unread notifications as read for the current admin.
 * Called when the notification panel is opened.
 */
export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminId = session.user.id;
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await markAllRead(adminId);

  return NextResponse.json({ markedRead: count });
}
