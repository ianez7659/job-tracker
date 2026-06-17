import { prisma } from "@/lib/prisma";

export type HiredRateStats = {
  /** Unique users with at least one current_hired offer */
  activeHired: number;
  /** activeHired / totalUsers × 100, rounded to 1 decimal */
  activeHiredRate: number;
  /** Unique users with current_hired OR inactive offer (ever verified) */
  cumulativeHired: number;
  /** cumulativeHired / totalUsers × 100, rounded to 1 decimal */
  cumulativeHiredRate: number;
  /** Distinct company names from current_hired offers only */
  uniqueCompanies: number;
  /** HiredOffers created within the selected date range */
  offersThisMonth: number;
  /** Total non-STAFF users (denominator — matches dashboard overview) */
  totalUsers: number;
};

export type HiredOfferRow = {
  profileId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  /** User.category (program/track, e.g. "IT / Tech", "Hospitality") */
  userCategory: string | null;
  offerId: string;
  /** Representative offer status — determines what data to display */
  status: string;
  company: string;
  title: string;
  offerDate: Date | null;
  employmentType: string | null;
  workArrangement: string | null;
  salaryRange: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  /** Total HiredOffers on this profile — used for Student cell badge */
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

/**
 * Aggregate stats for the Hired Rate page.
 *
 * @param dateFrom  Start of date range (inclusive). Defaults to first of current month.
 * @param dateTo    End of date range (inclusive). Defaults to last of current month.
 */
export async function getHiredRateStats(
  dateFrom?: Date,
  dateTo?: Date,
): Promise<HiredRateStats> {
  const now = new Date();
  const rangeStart =
    dateFrom ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const rangeEnd =
    dateTo ??
    new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [activeProfiles, cumulativeProfiles, currentHiredOffers, totalUsers, offersThisMonth] =
    await Promise.all([
      // Active: profiles with at least one current_hired offer
      prisma.hiredProfile.findMany({
        where: { offers: { some: { status: "current_hired" } } },
        select: { userId: true },
      }),
      // Cumulative: profiles with current_hired OR inactive offer (ever verified)
      prisma.hiredProfile.findMany({
        where: { offers: { some: { status: { in: ["current_hired", "inactive"] } } } },
        select: { userId: true },
      }),
      // current_hired only — for unique companies
      prisma.hiredOffer.findMany({
        where: { status: "current_hired" },
        select: { job: { select: { company: true } } },
      }),
      // All non-STAFF users — matches dashboard overview denominator
      prisma.user.count({
        where: { OR: [{ hubStatus: null }, { hubStatus: { not: "STAFF" } }] },
      }),
      prisma.hiredOffer.count({
        where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
      }),
    ]);

  const uniqueCompanyNames = new Set(
    currentHiredOffers.map((o) => o.job.company),
  );

  const activeHired = activeProfiles.length;
  const cumulativeHired = cumulativeProfiles.length;
  const uniqueCompanies = uniqueCompanyNames.size;
  const activeHiredRate =
    totalUsers > 0
      ? Math.round((activeHired / totalUsers) * 1000) / 10
      : 0;
  const cumulativeHiredRate =
    totalUsers > 0
      ? Math.round((cumulativeHired / totalUsers) * 1000) / 10
      : 0;

  return { activeHired, activeHiredRate, cumulativeHired, cumulativeHiredRate, uniqueCompanies, offersThisMonth, totalUsers };
}

/**
 * One row per HiredProfile (any offer status).
 * Representative offer: current_hired → newest pending → newest other.
 * Sorted by createdAt descending (newest profile first).
 */
export async function getHiredOfferRows(): Promise<HiredOfferRow[]> {
  const profiles = await prisma.hiredProfile.findMany({
    where: { offers: { some: {} } },
    select: {
      id: true,
      user: {
        select: { id: true, name: true, email: true, category: true },
      },
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

  return profiles
    .filter((p) => p.offers.length > 0)
    .map((p) => {
      const rep = pickRepresentative(p.offers);
      return {
        profileId: p.id,
        userId: p.user.id,
        userName: p.user.name,
        userEmail: p.user.email,
        userCategory: p.user.category,
        offerId: rep.id,
        status: rep.status,
        company: rep.job.company,
        title: rep.job.title,
        offerDate: rep.offerDate,
        employmentType: rep.employmentType,
        workArrangement: rep.workArrangement,
        salaryRange: rep.salaryRange,
        verifiedAt: rep.verifiedAt,
        createdAt: rep.createdAt,
        offerCount: p.offers.length,
      };
    });
}
