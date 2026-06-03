import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deactivateHiredOffer } from "@/domains/hired/user-service";

/**
 * PATCH /api/hired/offers/[offerId]/deactivate
 *
 * User-triggered: marks their current_hired offer as inactive.
 * Body: { reason?: string }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ offerId: string }> },
) {
  try {
    const { offerId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as { reason?: string };
    const reason = typeof body.reason === "string" ? body.reason.trim() || null : null;

    try {
      await deactivateHiredOffer({ userId: user.id, offerId, reason });
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "OFFER_NOT_FOUND") {
        return NextResponse.json({ message: "Offer not found" }, { status: 404 });
      }
      if (code === "FORBIDDEN") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      if (code === "NOT_CURRENT_HIRED") {
        return NextResponse.json(
          { message: (err as Error).message },
          { status: 400 },
        );
      }
      throw err;
    }

    return NextResponse.json({ message: "Offer deactivated" });
  } catch (err) {
    console.error("[PATCH /api/hired/offers/[offerId]/deactivate]", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
