import { prisma } from "@/lib/prisma";

export type HiredRateStats = {
  total: number;
  byStatus: Record<string, number>;
  bySalaryRange: Record<string, number>;
  byEmploymentType: Record<string, number>;
  byWorkArrangement: Record<string, number>;
};

export type HiredOfferRow = {
  offerId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
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

/**
 * Aggregate stats over all HiredOffers.
 * Returns counts grouped by status, salaryRange, employmentType, workArrangement.
 */
export async function getHiredRateStats(): Promise<HiredRateStats> {
  const [byStatusRaw, bySalaryRaw, byEmploymentRaw, byWorkRaw, total] =
    await Promise.all([
      prisma.hiredOffer.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.hiredOffer.groupBy({ by: ["salaryRange"], _count: { _all: true } }),
      prisma.hiredOffer.groupBy({ by: ["employmentType"], _count: { _all: true } }),
      prisma.hiredOffer.groupBy({ by: ["workArrangement"], _count: { _all: true } }),
      prisma.hiredOffer.count(),
    ]);

  function toRecord(
    rows: { _count: { _all: number } }[],
    key: string,
  ): Record<string, number> {
    const out: Record<string, number> = {};
    for (const row of rows) {
      const k = ((row as Record<string, unknown>)[key] as string | null) ?? "unknown";
      out[k] = row._count._all;
    }
    return out;
  }

  return {
    total,
    byStatus: toRecord(byStatusRaw, "status"),
    bySalaryRange: toRecord(bySalaryRaw, "salaryRange"),
    byEmploymentType: toRecord(byEmploymentRaw, "employmentType"),
    byWorkArrangement: toRecord(byWorkRaw, "workArrangement"),
  };
}

/**
 * Full list of HiredOffers with user + job details.
 * Ordered by createdAt desc (newest first).
 */
export async function getHiredOfferRows(): Promise<HiredOfferRow[]> {
  const rows = await prisma.hiredOffer.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      offerDate: true,
      employmentType: true,
      workArrangement: true,
      salaryRange: true,
      status: true,
      verifiedAt: true,
      createdAt: true,
      hiredProfile: {
        select: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      job: {
        select: { company: true, title: true },
      },
    },
  });

  return rows.map((r) => ({
    offerId: r.id,
    userId: r.hiredProfile.user.id,
    userName: r.hiredProfile.user.name,
    userEmail: r.hiredProfile.user.email,
    company: r.job.company,
    title: r.job.title,
    offerDate: r.offerDate,
    employmentType: r.employmentType,
    workArrangement: r.workArrangement,
    salaryRange: r.salaryRange,
    status: r.status,
    verifiedAt: r.verifiedAt,
    createdAt: r.createdAt,
  }));
}
