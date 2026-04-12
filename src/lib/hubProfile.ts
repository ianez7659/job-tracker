/**
 * Public profile fields on `User` — validation for PATCH /api/user/profile.
 */

export const HUB_PROFILE_STATUS_VALUES = ["STUDENT", "ALUMNI", "STAFF"] as const;
export type HubProfileStatusValue = (typeof HUB_PROFILE_STATUS_VALUES)[number];

export const USER_PROFILE_LIMITS = {
  name: 120,
  headline: 500,
} as const;

export type UserProfilePatch = {
  name?: string | null;
  hubStatus?: HubProfileStatusValue | null;
  headline?: string | null;
};

function isHubStatus(v: unknown): v is HubProfileStatusValue {
  return (
    typeof v === "string" &&
    (HUB_PROFILE_STATUS_VALUES as readonly string[]).includes(v)
  );
}

function trimOrNull(s: unknown, max: number): string | null | undefined {
  if (s === undefined) return undefined;
  if (s === null) return null;
  if (typeof s !== "string") return undefined;
  const t = s.trim();
  if (t.length === 0) return null;
  return t.length > max ? t.slice(0, max) : t;
}

/**
 * Parse JSON body for PATCH /api/user/profile. Unknown keys ignored.
 */
export function parseUserProfilePatch(body: unknown):
  | { ok: true; patch: UserProfilePatch }
  | { ok: false; error: string } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Expected JSON object" };
  }

  const o = body as Record<string, unknown>;
  const patch: UserProfilePatch = {};

  if ("name" in o) {
    const v = trimOrNull(o.name, USER_PROFILE_LIMITS.name);
    if (v === undefined && o.name !== undefined && o.name !== null) {
      return { ok: false, error: "name must be a string or null" };
    }
    if (v !== undefined) patch.name = v;
  }

  if ("headline" in o) {
    const v = trimOrNull(o.headline, USER_PROFILE_LIMITS.headline);
    if (v === undefined && o.headline !== undefined && o.headline !== null) {
      return { ok: false, error: "headline must be a string or null" };
    }
    if (v !== undefined) patch.headline = v;
  }

  if ("hubStatus" in o) {
    const raw = o.hubStatus;
    if (raw === null) {
      patch.hubStatus = null;
    } else if (raw === undefined) {
      /* skip */
    } else if (isHubStatus(raw)) {
      patch.hubStatus = raw;
    } else {
      return {
        ok: false,
        error: `hubStatus must be one of: ${HUB_PROFILE_STATUS_VALUES.join(", ")} or null`,
      };
    }
  }

  return { ok: true, patch };
}
