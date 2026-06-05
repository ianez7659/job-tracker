import { NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { markHiredOfferUnverifiable } from "@/domains/hired/admin-service";

/**
 * POST /api/admin/hired/offers/[offerId]/mark-unverifiable
 *
 * Admin-only: marks the offer as unverifiable.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ offerId: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { offerId } = await params;

  try {
    const offer = await markHiredOfferUnverifiable({ adminId: session.user.id ?? "", offerId });
    return NextResponse.json({ offer });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "OFFER_NOT_FOUND") {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    console.error("[POST /api/admin/hired/offers/[offerId]/mark-unverifiable]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
