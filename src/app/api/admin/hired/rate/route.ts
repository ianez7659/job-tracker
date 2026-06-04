import { NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { getHiredRateStats, getHiredOfferRows } from "@/domains/admin/hiredRate";

/**
 * GET /api/admin/hired/rate
 *
 * Admin-only: returns aggregate HiredOffer stats + full offer list.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [stats, rows] = await Promise.all([getHiredRateStats(), getHiredOfferRows()]);

  return NextResponse.json({ stats, rows });
}
