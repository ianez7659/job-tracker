import { NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/hired/pool/pending-count
 *
 * Admin-only: returns the count of HiredOffers that are complete (offerDate
 * and employmentType filled) but still awaiting admin verification (status =
 * "pending"). Used to drive the unread badge on the "Hired Pool" sidebar item.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await prisma.hiredOffer.count({
    where: {
      status: "pending",
      offerDate: { not: null },
      employmentType: { not: null },
    },
  });

  return NextResponse.json({ count });
}
