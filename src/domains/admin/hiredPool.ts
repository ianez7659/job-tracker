import { prisma } from "@/lib/prisma";

export type HiredProfileDetail = {
  profileId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userCategory: string | null;
  notes: string | null;
  followUpDate: Date | null;
  profileCreatedAt: Date;
  offers: HiredPoolOffer[];
};

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
  deactivatedAt: Date | null;
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
 * Returns a single HiredProfile with all offers and user details.
 * Returns null if not found.
 */
export async function getHiredProfileDetail(
  profileId: string,
): Promise<HiredProfileDetail | null> {
  const profile = await prisma.hiredProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      notes: true,
      followUpDate: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, email: true, category: true },
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
          deactivatedAt: true,
          createdAt: true,
          job: {
            select: { company: true, title: true },
          },
        },
      },
    },
  });

  if (!profile) return null;

  return {
    profileId: profile.id,
    userId: profile.user.id,
    userName: profile.user.name,
    userEmail: profile.user.email,
    userCategory: profile.user.category,
    notes: profile.notes,
    followUpDate: profile.followUpDate,
    profileCreatedAt: profile.createdAt,
    offers: profile.offers.map((o) => ({
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
      deactivatedAt: o.deactivatedAt,
      createdAt: o.createdAt,
    })),
  };
}

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
          deactivatedAt: true,
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
      deactivatedAt: o.deactivatedAt,
      createdAt: o.createdAt,
    })),
  }));
}
