import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { completeOfferSelection } from "@/domains/hired/user-service";
import {
  EMPLOYMENT_TYPES,
  WORK_ARRANGEMENTS,
  SALARY_RANGES,
} from "@/domains/hired/constants";

/**
 * PATCH /api/hired/offers/[offerId]/complete
 *
 * User fills in missing offer details for an existing pending HiredOffer.
 * Marks all other pending offers on the same profile as "not_selected".
 *
 * Body (required):
 *   offerDate       ISO 8601 date string
 *   employmentType  "full_time" | "part_time" | "contract" | "internship"
 * Body (optional):
 *   workArrangement "on_site" | "remote" | "hybrid"
 *   salaryRange     "not_disclosed" | "under_40k" | ... | "80k_plus"
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ offerId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { offerId } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate offerDate (required)
  const rawDate = body.offerDate;
  if (!rawDate || typeof rawDate !== "string" || isNaN(new Date(rawDate).getTime())) {
    return NextResponse.json(
      { error: "offerDate is required and must be a valid ISO date string" },
      { status: 400 },
    );
  }

  // Validate employmentType (required)
  const employmentType = body.employmentType;
  if (!employmentType || !(EMPLOYMENT_TYPES as readonly string[]).includes(employmentType as string)) {
    return NextResponse.json(
      { error: `employmentType is required and must be one of: ${EMPLOYMENT_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  // Validate workArrangement (optional)
  const workArrangement = body.workArrangement ?? null;
  if (workArrangement !== null && !(WORK_ARRANGEMENTS as readonly string[]).includes(workArrangement as string)) {
    return NextResponse.json(
      { error: `workArrangement must be one of: ${WORK_ARRANGEMENTS.join(", ")}` },
      { status: 400 },
    );
  }

  // Validate salaryRange (optional)
  const salaryRange = body.salaryRange ?? null;
  if (salaryRange !== null && !(SALARY_RANGES as readonly string[]).includes(salaryRange as string)) {
    return NextResponse.json(
      { error: `salaryRange must be one of: ${SALARY_RANGES.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    await completeOfferSelection({
      userId: session.user.id,
      offerId,
      offerDate: new Date(rawDate),
      employmentType: employmentType as (typeof EMPLOYMENT_TYPES)[number],
      workArrangement: workArrangement as (typeof WORK_ARRANGEMENTS)[number] | null,
      salaryRange: salaryRange as (typeof SALARY_RANGES)[number] | null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "OFFER_NOT_FOUND") {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    if (code === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (code === "INVALID_STATUS") {
      return NextResponse.json({ error: "Offer is not in pending status" }, { status: 409 });
    }
    console.error("[PATCH /api/hired/offers/[offerId]/complete]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
