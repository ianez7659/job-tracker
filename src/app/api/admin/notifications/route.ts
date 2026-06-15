import { NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { listNotifications } from "@/domains/admin/notifications";

/**
 * GET /api/admin/notifications
 *
 * Returns the most recent admin notifications with per-admin read status.
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

  const notifications = await listNotifications(adminId);

  return NextResponse.json({ notifications });
}
