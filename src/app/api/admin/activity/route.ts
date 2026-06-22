import { type NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { getActivityLogs } from "@/domains/admin/activityLog";

/**
 * GET /api/admin/activity
 *
 * Admin-only: returns paginated activity logs with optional filters.
 * Query params: action, targetType, targetId, page, perPage
 */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? undefined;
  const targetType = url.searchParams.get("targetType") ?? undefined;
  const targetId = url.searchParams.get("targetId") ?? undefined;
  const page = parseInt(url.searchParams.get("page") ?? "1", 10) || 1;
  const perPage = parseInt(url.searchParams.get("perPage") ?? "20", 10) || 20;

  const result = await getActivityLogs({
    action,
    targetType,
    targetId,
    page,
    perPage,
  });

  return NextResponse.json(result);
}
