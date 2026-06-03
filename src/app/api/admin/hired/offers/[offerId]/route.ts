import { NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { updateHiredOfferDetails } from "@/domains/hired/admin-service";
import {
  EMPLOYMENT_TYPES,
  WORK_ARRANGEMENTS,
  SALARY_RANGES,
} from "@/domains/hired/constants";

/**
 * PATCH /api/admin/hired/offers/[offerId]
 *
 * Admin-only: update offer detail fields.
 * All body fields are optional — only supplied fields are written.
 *
 * Body (all optional):
 *   offerDate        ISO 8601 date string | null
 *   employmentType   "full_time" | "part_time" | "contract" | "internship" | null
 *   workArrangement  "on_site" | "remote" | "hybrid" | null
 *   salaryRange      "not_disclosed" | "under_40k" | ... | "80k_plus" | null
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ offerId: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { offerId } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // --- Validate supplied fields ---
  if ("employmentType" in body) {
    const v = body.employmentType;
    if (v !== null && !(EMPLOYMENT_TYPES as readonly string[]).includes(v as string)) {
      return NextResponse.json(
        { error: `employmentType must be one of: ${EMPLOYMENT_TYPES.join(", ")}` },
        { status: 400 },
      );
    }
  }

  if ("workArrangement" in body) {
    const v = body.workArrangement;
    if (v !== null && !(WORK_ARRANGEMENTS as readonly string[]).includes(v as string)) {
      return NextResponse.json(
        { error: `workArrangement must be one of: ${WORK_ARRANGEMENTS.join(", ")}` },
        { status: 400 },
      );
    }
  }

  if ("salaryRange" in body) {
    const v = body.salaryRange;
    if (v !== null && !(SALARY_RANGES as readonly string[]).includes(v as string)) {
      return NextResponse.json(
        { error: `salaryRange must be one of: ${SALARY_RANGES.join(", ")}` },
        { status: 400 },
      );
    }
  }

  if ("offerDate" in body) {
    const v = body.offerDate;
    if (v !== null && (typeof v !== "string" || isNaN(new Date(v).getTime()))) {
      return NextResponse.json({ error: "offerDate must be a valid ISO date string or null" }, { status: 400 });
    }
  }

  // --- Build typed input ---
  const input: Parameters<typeof updateHiredOfferDetails>[0] = {
    adminId: session.user.id ?? "",
    offerId,
  };

  if ("offerDate" in body) {
    input.offerDate = body.offerDate === null ? null : new Date(body.offerDate as string);
  }
  if ("employmentType" in body) {
    input.employmentType =
      (body.employmentType as (typeof EMPLOYMENT_TYPES)[number] | null) ?? null;
  }
  if ("workArrangement" in body) {
    input.workArrangement =
      (body.workArrangement as (typeof WORK_ARRANGEMENTS)[number] | null) ?? null;
  }
  if ("salaryRange" in body) {
    input.salaryRange =
      (body.salaryRange as (typeof SALARY_RANGES)[number] | null) ?? null;
  }

  // --- Domain call ---
  try {
    const offer = await updateHiredOfferDetails(input);
    return NextResponse.json({ offer });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "OFFER_NOT_FOUND") {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    console.error("[PATCH /api/admin/hired/offers/[offerId]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
