import { prisma } from "@/lib/prisma";
import { isAllowedStatusTransition } from "@/lib/jobPipeline";
import { deriveCycleEndStage } from "@/lib/xp/cycleStage";
import { createAdminNotification } from "@/domains/admin/notifications";
import type { EmploymentType, WorkArrangement, SalaryRange } from "./constants";

export type OfferTransitionInput = {
  userId: string;
  jobId: string;
  offerDate: Date;
  employmentType: EmploymentType;
  workArrangement?: WorkArrangement | null;
  salaryRange?: SalaryRange | null;
};

export type OfferTransitionResult = {
  job: {
    id: string;
    title: string;
    company: string;
    status: string;
    appliedAt: Date;
    url: string | null;
    jd: string | null;
    cycleEndStage: string | null;
  };
  hiredProfile: {
    id: string;
    userId: string;
    followUpDate: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  hiredOffer: {
    id: string;
    hiredProfileId: string;
    jobId: string;
    offerDate: Date | null;
    employmentType: string | null;
    workArrangement: string | null;
    salaryRange: string | null;
    status: string;
    verifiedAt: Date | null;
    verifiedByUserId: string | null;
    deactivatedAt: Date | null;
    deactivatedByUserId: string | null;
    deactivateReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

/**
 * Atomically transitions a job to "offer" status and creates the
 * HiredProfile + HiredOffer records in a single Prisma transaction.
 *
 * Throws with a typed error code so the API route can map to HTTP status.
 */
export async function createOfferTransition(
  input: OfferTransitionInput,
): Promise<OfferTransitionResult> {
  const { userId, jobId, offerDate, employmentType, workArrangement, salaryRange } = input;

  // 1. Verify job belongs to this user and is not deleted
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId, deletedAt: null },
  });

  if (!job) {
    const err = new Error("Job not found or does not belong to user");
    (err as NodeJS.ErrnoException).code = "JOB_NOT_FOUND";
    throw err;
  }

  // 2. Validate the status transition
  if (!isAllowedStatusTransition(job.status, "offer")) {
    const err = new Error(
      `Status transition from "${job.status}" to "offer" is not allowed`,
    );
    (err as NodeJS.ErrnoException).code = "INVALID_TRANSITION";
    throw err;
  }

  const cycleEndStage = deriveCycleEndStage(job.status);

  // 3. Transaction: update job + upsert HiredProfile + create HiredOffer
  const [updatedJob, hiredProfile, hiredOffer] = await prisma.$transaction(
    async (tx) => {
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: "offer",
          deletedAt: new Date(),
          ...(cycleEndStage !== null && { cycleEndStage }),
        },
        select: {
          id: true,
          title: true,
          company: true,
          status: true,
          appliedAt: true,
          url: true,
          jd: true,
          cycleEndStage: true,
        },
      });

      const hiredProfile = await tx.hiredProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });

      const hiredOffer = await tx.hiredOffer.create({
        data: {
          hiredProfileId: hiredProfile.id,
          jobId,
          offerDate,
          employmentType,
          workArrangement: workArrangement ?? null,
          salaryRange: salaryRange ?? "not_disclosed",
          status: "pending",
        },
      });

      return [updatedJob, hiredProfile, hiredOffer] as const;
    },
  );

  return { job: updatedJob, hiredProfile, hiredOffer };
}

// ── Deactivate ────────────────────────────────────────────────────────────────

export type DeactivateInput = {
  userId: string;
  offerId: string;
  reason?: string | null;
};

/**
 * User-triggered deactivation of their current_hired offer.
 * Validates ownership and status, then sets the offer to "inactive".
 *
 * Throws with typed error codes:
 *   OFFER_NOT_FOUND      — offerId does not exist
 *   FORBIDDEN            — offer does not belong to userId
 *   NOT_CURRENT_HIRED    — offer.status is not "current_hired"
 */
export async function deactivateHiredOffer(input: DeactivateInput): Promise<void> {
  const { userId, offerId, reason } = input;

  const offer = await prisma.hiredOffer.findUnique({
    where: { id: offerId },
    include: { hiredProfile: { select: { userId: true } } },
  });

  if (!offer) {
    const err = new Error("Offer not found");
    (err as NodeJS.ErrnoException).code = "OFFER_NOT_FOUND";
    throw err;
  }

  if (offer.hiredProfile.userId !== userId) {
    const err = new Error("Forbidden");
    (err as NodeJS.ErrnoException).code = "FORBIDDEN";
    throw err;
  }

  if (offer.status !== "current_hired") {
    const err = new Error(`Offer status is "${offer.status}", not "current_hired"`);
    (err as NodeJS.ErrnoException).code = "NOT_CURRENT_HIRED";
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.hiredOffer.update({
      where: { id: offerId },
      data: {
        status: "inactive",
        deactivatedAt: new Date(),
        deactivatedByUserId: userId,
        deactivateReason: reason ?? null,
      },
    });
    // Look up user info for the notification message
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, category: true },
    });
    const displayName = user.name ?? "Unknown";
    const displayCategory = user.category ?? "N/A";
    await createAdminNotification(
      {
        type: "offer_deactivated",
        message: `${displayName} (${displayCategory}) deactivated an offer`,
        profileId: offer.hiredProfileId,
        offerId,
      },
      tx,
    );
  });
}

// ── Complete Offer Selection ───────────────────────────────────────────────────

export type CompleteOfferSelectionInput = {
  userId: string;
  offerId: string;
  offerDate: Date;
  employmentType: EmploymentType;
  workArrangement?: WorkArrangement | null;
  salaryRange?: SalaryRange | null;
};

/**
 * User completes offer details for an existing pending HiredOffer
 * (created by backfill or a previous transition with missing data).
 *
 * - Updates the selected offer with the provided detail fields.
 * - Marks all other pending offers on the same HiredProfile as "not_selected".
 * - Offer remains "pending" until admin verifies it in /admin/hired-pool.
 *
 * Throws with typed error codes:
 *   OFFER_NOT_FOUND  — offerId does not exist
 *   FORBIDDEN        — offer does not belong to userId
 *   INVALID_STATUS   — offer is not in "pending" state
 */
export async function completeOfferSelection(
  input: CompleteOfferSelectionInput,
): Promise<void> {
  const { userId, offerId, offerDate, employmentType, workArrangement, salaryRange } = input;

  const offer = await prisma.hiredOffer.findUnique({
    where: { id: offerId },
    include: { hiredProfile: { select: { id: true, userId: true } } },
  });

  if (!offer) {
    const err = new Error("Offer not found");
    (err as NodeJS.ErrnoException).code = "OFFER_NOT_FOUND";
    throw err;
  }

  if (offer.hiredProfile.userId !== userId) {
    const err = new Error("Forbidden");
    (err as NodeJS.ErrnoException).code = "FORBIDDEN";
    throw err;
  }

  if (offer.status !== "pending") {
    const err = new Error(`Offer status is "${offer.status}", not "pending"`);
    (err as NodeJS.ErrnoException).code = "INVALID_STATUS";
    throw err;
  }

  const hiredProfileId = offer.hiredProfile.id;

  await prisma.$transaction(async (tx) => {
    // Mark all other pending offers on this profile as not_selected
    await tx.hiredOffer.updateMany({
      where: { hiredProfileId, status: "pending", id: { not: offerId } },
      data: { status: "not_selected" },
    });
    // Update the selected offer with detail fields
    await tx.hiredOffer.update({
      where: { id: offerId },
      data: {
        offerDate,
        employmentType,
        workArrangement: workArrangement ?? null,
        salaryRange: salaryRange ?? "not_disclosed",
      },
    });
    // Look up user info for the notification message
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, category: true },
    });
    const displayName = user.name ?? "Unknown";
    const displayCategory = user.category ?? "N/A";
    await createAdminNotification(
      {
        type: "new_offer",
        message: `${displayName} (${displayCategory}) submitted a new offer`,
        profileId: hiredProfileId,
        offerId,
      },
      tx,
    );
  });
}
