import type { HiredOfferStatus } from "@/lib/constants/hired";

export type { HiredOfferStatus };

export type HiredProfileRecord = {
  id: string;
  userId: string;
  followUpDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type HiredOfferRecord = {
  id: string;
  hiredProfileId: string;
  jobId: string;
  offerDate: Date | null;
  employmentType: string | null;
  workArrangement: string | null;
  salaryRange: string | null;
  status: HiredOfferStatus;
  verifiedAt: Date | null;
  verifiedByUserId: string | null;
  deactivatedAt: Date | null;
  deactivatedByUserId: string | null;
  deactivateReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type HiredOfferWithJob = HiredOfferRecord & {
  job: {
    id: string;
    title: string;
    company: string;
    status: string;
    appliedAt: Date;
  };
};

export type HiredProfileWithOffers = HiredProfileRecord & {
  offers: HiredOfferWithJob[];
};
