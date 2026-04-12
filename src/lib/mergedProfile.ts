import { getCategoryLabel } from "@/lib/constants/categories";

/** Values stored on `User.hubStatus` (Role in UI). */
export type HubProfileStatus = "STUDENT" | "ALUMNI" | "STAFF";

/** Subset of `User` needed for merged public profile. */
export type PublicUserRow = {
  id: string;
  name: string | null;
  image: string | null;
  category: string | null;
  hubStatus: HubProfileStatus | null;
  headline: string | null;
};

/**
 * Single object for community UI and clients. Fields live on `User`.
 */
export type MergedPublicProfile = {
  userId: string;
  displayName: string | null;
  headline: string | null;
  hubStatus: HubProfileStatus | null;
  jobCategory: string | null;
  jobCategoryLabel: string;
  image: string | null;
  /** One line for cards: job category label when set. */
  communityDisplayLine: string | null;
};

export function buildMergedPublicProfile(
  user: PublicUserRow,
): MergedPublicProfile {
  const jobCategoryLabel = getCategoryLabel(user.category);
  const displayName = user.name?.trim() || null;
  const communityDisplayLine = user.category ? jobCategoryLabel : null;

  return {
    userId: user.id,
    displayName,
    headline: user.headline?.trim() || null,
    hubStatus: user.hubStatus ?? null,
    jobCategory: user.category ?? null,
    jobCategoryLabel,
    image: user.image ?? null,
    communityDisplayLine,
  };
}
