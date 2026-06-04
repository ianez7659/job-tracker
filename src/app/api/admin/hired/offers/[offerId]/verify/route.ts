import { NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { verifyHiredOfferAsAdmin } from "@/domains/hired/admin-service";

/**
 * POST /api/admin/hired/offers/[offerId]/verify
 *
 * Admin-only: marks the offer as verified (current_hired).
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
    const offer = await verifyHiredOfferAsAdmin({ adminId: session.user.id ?? "", offerId });
    return NextResponse.json({ offer });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "OFFER_NOT_FOUND") {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    console.error("[POST /api/admin/hired/offers/[offerId]/verify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
