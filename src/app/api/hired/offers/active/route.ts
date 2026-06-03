import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/hired/offers/active
 *
 * Returns the logged-in user's active hired offer:
 *   status === "current_hired" AND verifiedAt IS NOT NULL
 *
 * Response: { offer: ActiveHiredOffer | null }
 */
export async function GET() {
  try {
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

    const hiredProfile = await prisma.hiredProfile.findUnique({
      where: { userId: user.id },
      select: {
        offers: {
          where: {
            status: "current_hired",
            verifiedAt: { not: null },
          },
          take: 1,
          orderBy: { verifiedAt: "desc" },
          select: {
            id: true,
            offerDate: true,
            employmentType: true,
            workArrangement: true,
            salaryRange: true,
            verifiedAt: true,
            job: {
              select: {
                id: true,
                title: true,
                company: true,
              },
            },
          },
        },
      },
    });

    const raw = hiredProfile?.offers[0] ?? null;

    if (!raw) {
      return NextResponse.json({ offer: null });
    }

    const offer = {
      offerId: raw.id,
      company: raw.job.company,
      title: raw.job.title,
      offerDate: raw.offerDate?.toISOString() ?? null,
      employmentType: raw.employmentType,
      workArrangement: raw.workArrangement,
      salaryRange: raw.salaryRange,
      verifiedAt: raw.verifiedAt?.toISOString() ?? null,
    };

    return NextResponse.json({ offer });
  } catch (err) {
    console.error("[GET /api/hired/offers/active]", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
