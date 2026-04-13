/**
 * Business card AI extraction — shared types and formatting.
 * Images must never be persisted; only these text fields are returned/stored on the job.
 */

export type BusinessCardFields = {
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
};

/**
 * Parse JSON from the vision model. Tolerates extra keys; normalizes strings.
 */
export function parseBusinessCardJson(raw: string): BusinessCardFields | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  const o = parsed as Record<string, unknown>;
  const str = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t.length === 0 ? null : t;
  };
  return {
    name: str(o.name),
    company: str(o.company),
    email: str(o.email),
    phone: str(o.phone),
  };
}

/** Human-readable block for the job `jd` field (no image data). */
export function formatBusinessCardNotes(f: BusinessCardFields): string {
  const lines = [
    "[Business card — AI extracted]",
    f.name ? `Name: ${f.name}` : null,
    f.company ? `Company: ${f.company}` : null,
    f.email ? `Email: ${f.email}` : null,
    f.phone ? `Phone: ${f.phone}` : null,
  ].filter(Boolean) as string[];
  return lines.join("\n");
}
