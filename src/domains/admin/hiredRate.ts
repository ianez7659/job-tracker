import { prisma } from "@/lib/prisma";

export type HiredRateStats = {
  total: number;
  byStatus: Record<string, number>;
  bySalaryRange: Record<string, number>;
  byEmploymentType: Record<string, number>;
  byWorkArrangement: Record<string, number>;
};

export type HiredOfferRow = {
  profileId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  /** Representative offer fields */
  offerId: string;
  company: string;
  title: string;
  offerDate: Date | null;
  employmentType: string | null;
  workArrangement: string | null;
  salaryRange: string | null;
  status: string;
  verifiedAt: Date | null;
  createdAt: Date;
  /** Total number of HiredOffers on this profile */
  offerCount: number;
};

type RawOffer = {
  id: string;
  status: string;
  offerDate: Date | null;
  employmentType: string | null;
  workArrangement: string | null;
  salaryRange: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  job: { company: string; title: string };
};

/**
 * Pick one representative offer from a profile's offer list.
 * Priority: current_hired → newest pending → newest other
 */
function pickRepresentative(offers: RawOffer[]): RawOffer {
  const currentHired = offers.find((o) => o.status === "current_hired");
  if (currentHired) return currentHired;

  const pendingSorted = offers
    .filter((o) => o.status === "pending")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  if (pendingSorted.length > 0) return pendingSorted[0];

  return [...offers].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )[0];
}

/** Load all HiredProfiles with their offers, user, and job details. */
async function loadProfiles() {
  return prisma.hiredProfile.findMany({
    select: {
      id: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      offers: {
        select: {
          id: true,
          status: true,
          offerDate: true,
          employmentType: true,
          workArrangement: true,
          salaryRange: true,
          verifiedAt: true,
          createdAt: true,
          job: { select: { company: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Aggregate stats over all HiredProfiles (one person = one unit).
 * Stats are derived from each profile's representative offer.
 */
export async function getHiredRateStats(): Promise<HiredRateStats> {
  const profiles = await loadProfiles();
  const active = profiles.filter((p) => p.offers.length > 0);

  const byStatus: Record<string, number> = {};
  const bySalaryRange: Record<string, number> = {};
  const byEmploymentType: Record<string, number> = {};
  const byWorkArrangement: Record<string, number> = {};

  for (const profile of active) {
    const rep = pickRepresentative(profile.offers);

    byStatus[rep.status] = (byStatus[rep.status] ?? 0) + 1;

    const salary = rep.salaryRange ?? "unknown";
    bySalaryRange[salary] = (bySalaryRange[salary] ?? 0) + 1;

    if (rep.employmentType) {
      byEmploymentType[rep.employmentType] =
        (byEmploymentType[rep.employmentType] ?? 0) + 1;
    }

    if (rep.workArrangement) {
      byWorkArrangement[rep.workArrangement] =
        (byWorkArrangement[rep.workArrangement] ?? 0) + 1;
    }
  }

  return {
    total: active.length,
    byStatus,
    bySalaryRange,
    byEmploymentType,
    byWorkArrangement,
  };
}

/**
 * One row per HiredProfile using the representative offer for display.
 * Ordered by profile createdAt desc (newest first).
 */
export async function getHiredOfferRows(): Promise<HiredOfferRow[]> {
  const profiles = await loadProfiles();

  return profiles
    .filter((p) => p.offers.length > 0)
    .map((p) => {
      const rep = pickRepresentative(p.offers);
      return {
        profileId: p.id,
        userId: p.user.id,
        userName: p.user.name,
        userEmail: p.user.email,
        offerId: rep.id,
        company: rep.job.company,
        title: rep.job.title,
        offerDate: rep.offerDate,
        employmentType: rep.employmentType,
        workArrangement: rep.workArrangement,
        salaryRange: rep.salaryRange,
        status: rep.status,
        verifiedAt: rep.verifiedAt,
        createdAt: rep.createdAt,
        offerCount: p.offers.length,
      };
    });
}
