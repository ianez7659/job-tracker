import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type PendingOffer = {
  offerId: string;
  jobId: string;
  company: string;
  title: string;
  status: string;
  offerDate: Date | null;
  employmentType: string | null;
  createdAt: Date;
};

/**
 * GET /api/hired/offers/pending
 *
 * Returns incomplete pending HiredOffers for the current user.
 * "Incomplete" means status === "pending" AND (offerDate OR employmentType is null).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.hiredProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      offers: {
        where: {
          status: "pending",
          OR: [{ offerDate: null }, { employmentType: null }],
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          jobId: true,
          offerDate: true,
          employmentType: true,
          status: true,
          createdAt: true,
          job: { select: { company: true, title: true } },
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ offers: [] });
  }

  const offers: PendingOffer[] = profile.offers.map((o) => ({
    offerId: o.id,
    jobId: o.jobId,
    company: o.job.company,
    title: o.job.title,
    status: o.status,
    offerDate: o.offerDate,
    employmentType: o.employmentType,
    createdAt: o.createdAt,
  }));

  return NextResponse.json({ offers });
}
