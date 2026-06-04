import { NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { getHiredPoolEntries } from "@/domains/admin/hiredPool";

/**
 * GET /api/admin/hired/pool
 *
 * Admin-only: returns all HiredProfiles with offers and user/job details.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await getHiredPoolEntries();
  return NextResponse.json({ entries });
}
