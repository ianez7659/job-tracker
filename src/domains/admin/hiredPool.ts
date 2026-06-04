import { prisma } from "@/lib/prisma";

export type HiredPoolOffer = {
  offerId: string;
  jobId: string;
  company: string;
  title: string;
  offerDate: Date | null;
  employmentType: string | null;
  workArrangement: string | null;
  salaryRange: string | null;
  status: string;
  verifiedAt: Date | null;
  createdAt: Date;
};

export type HiredPoolEntry = {
  profileId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  notes: string | null;
  followUpDate: Date | null;
  profileCreatedAt: Date;
  offers: HiredPoolOffer[];
};

/**
 * Returns all HiredProfiles with their offers and user/job details.
 * Ordered by profileCreatedAt desc (newest first).
 */
export async function getHiredPoolEntries(): Promise<HiredPoolEntry[]> {
  const profiles = await prisma.hiredProfile.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      notes: true,
      followUpDate: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, email: true },
      },
      offers: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          jobId: true,
          offerDate: true,
          employmentType: true,
          workArrangement: true,
          salaryRange: true,
          status: true,
          verifiedAt: true,
          createdAt: true,
          job: {
            select: { company: true, title: true },
          },
        },
      },
    },
  });

  return profiles.map((p) => ({
    profileId: p.id,
    userId: p.user.id,
    userName: p.user.name,
    userEmail: p.user.email,
    notes: p.notes,
    followUpDate: p.followUpDate,
    profileCreatedAt: p.createdAt,
    offers: p.offers.map((o) => ({
      offerId: o.id,
      jobId: o.jobId,
      company: o.job.company,
      title: o.job.title,
      offerDate: o.offerDate,
      employmentType: o.employmentType,
      workArrangement: o.workArrangement,
      salaryRange: o.salaryRange,
      status: o.status,
      verifiedAt: o.verifiedAt,
      createdAt: o.createdAt,
    })),
  }));
}
