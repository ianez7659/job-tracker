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

// ── Verify ────────────────────────────────────────────────────────────────────

/**
 * Admin-only: marks an offer as verified (current_hired).
 * Idempotent — safe to call even if already current_hired.
 *
 * Throws:
 *   OFFER_NOT_FOUND — offerId does not exist
 */
export async function verifyHiredOfferAsAdmin(input: {
  adminId: string;
  offerId: string;
}): Promise<UpdatedHiredOffer> {
  const { adminId, offerId } = input;

  const existing = await prisma.hiredOffer.findUnique({
    where: { id: offerId },
    select: { id: true },
  });

  if (!existing) {
    const err = new Error("Offer not found");
    (err as NodeJS.ErrnoException).code = "OFFER_NOT_FOUND";
    throw err;
  }

  const updated = await prisma.hiredOffer.update({
    where: { id: offerId },
    data: {
      status: "current_hired",
      verifiedAt: new Date(),
      verifiedByUserId: adminId,
    },
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

// ── Admin Deactivate ───────────────────────────────────────────────────────────

/**
 * Admin-only: deactivates an offer (any status → inactive).
 *
 * Throws:
 *   OFFER_NOT_FOUND — offerId does not exist
 */
export async function adminDeactivateHiredOffer(input: {
  adminId: string;
  offerId: string;
}): Promise<UpdatedHiredOffer> {
  const { adminId, offerId } = input;

  const existing = await prisma.hiredOffer.findUnique({
    where: { id: offerId },
    select: { id: true },
  });

  if (!existing) {
    const err = new Error("Offer not found");
    (err as NodeJS.ErrnoException).code = "OFFER_NOT_FOUND";
    throw err;
  }

  const updated = await prisma.hiredOffer.update({
    where: { id: offerId },
    data: {
      status: "inactive",
      deactivatedAt: new Date(),
      deactivatedByUserId: adminId,
    },
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

// ── Profile Notes ─────────────────────────────────────────────────────────────

/**
 * Admin-only: updates the notes field of a HiredProfile.
 *
 * Throws:
 *   PROFILE_NOT_FOUND — profileId does not exist
 */
export async function updateHiredProfileNotes(input: {
  adminId: string;
  profileId: string;
  notes: string | null;
}): Promise<{ id: string; notes: string | null; updatedAt: Date }> {
  const { profileId, notes } = input;

  const existing = await prisma.hiredProfile.findUnique({
    where: { id: profileId },
    select: { id: true },
  });

  if (!existing) {
    const err = new Error("Profile not found");
    (err as NodeJS.ErrnoException).code = "PROFILE_NOT_FOUND";
    throw err;
  }

  const updated = await prisma.hiredProfile.update({
    where: { id: profileId },
    data: { notes },
    select: { id: true, notes: true, updatedAt: true },
  });

  return updated;
}
