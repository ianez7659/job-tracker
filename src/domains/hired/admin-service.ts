import { prisma } from "@/lib/prisma";
import type { EmploymentType, WorkArrangement, SalaryRange } from "./constants";

export type UpdateHiredOfferInput = {
  adminId: string;
  offerId: string;
  offerDate?: Date | null;
  employmentType?: EmploymentType | null;
  workArrangement?: WorkArrangement | null;
  salaryRange?: SalaryRange | null;
};

export type UpdatedHiredOffer = {
  id: string;
  hiredProfileId: string;
  jobId: string;
  offerDate: Date | null;
  employmentType: string | null;
  workArrangement: string | null;
  salaryRange: string | null;
  status: string;
  verifiedAt: Date | null;
  updatedAt: Date;
};

/**
 * Admin-only: updates the offer detail fields of an existing HiredOffer.
 * Only fields explicitly passed (non-undefined) are written.
 *
 * Throws with typed error codes:
 *   OFFER_NOT_FOUND — offerId does not exist
 */
export async function updateHiredOfferDetails(
  input: UpdateHiredOfferInput,
): Promise<UpdatedHiredOffer> {
  const { offerId, offerDate, employmentType, workArrangement, salaryRange } = input;

  const existing = await prisma.hiredOffer.findUnique({
    where: { id: offerId },
    select: { id: true },
  });

  if (!existing) {
    const err = new Error("Offer not found");
    (err as NodeJS.ErrnoException).code = "OFFER_NOT_FOUND";
    throw err;
  }

  // Build update payload — only include fields that were explicitly provided
  const data: Record<string, unknown> = {};
  if (offerDate !== undefined) data.offerDate = offerDate;
  if (employmentType !== undefined) data.employmentType = employmentType;
  if (workArrangement !== undefined) data.workArrangement = workArrangement;
  if (salaryRange !== undefined) data.salaryRange = salaryRange;

  const updated = await prisma.hiredOffer.update({
    where: { id: offerId },
    data,
    select: {
      id: true,
      hiredProfileId: true,
      jobId: true,
      offerDate: true,
      employmentType: true,
      workArrangement: true,
      salaryRange: true,
      status: true,
      verifiedAt: true,
      updatedAt: true,
    },
  });

  return updated;
}
