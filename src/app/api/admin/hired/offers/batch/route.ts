import { NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import {
  batchVerifyHiredOffers,
  batchDeactivateHiredOffers,
  batchMarkUnverifiable,
} from "@/domains/hired/admin-service";

const ALLOWED_ACTIONS = ["verify", "deactivate", "mark_unverifiable"] as const;
type BatchAction = (typeof ALLOWED_ACTIONS)[number];
const MAX_OFFER_IDS = 50;

/**
 * POST /api/admin/hired/offers/batch
 *
 * Admin-only: execute a batch action on multiple offers at once.
 * Body: { action: "verify" | "deactivate" | "mark_unverifiable", offerIds: string[] }
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string; offerIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, offerIds } = body;

  if (
    !action ||
    !ALLOWED_ACTIONS.includes(action as BatchAction)
  ) {
    return NextResponse.json(
      { error: `Invalid action. Allowed: ${ALLOWED_ACTIONS.join(", ")}` },
      { status: 400 },
    );
  }

  if (
    !Array.isArray(offerIds) ||
    offerIds.length === 0 ||
    offerIds.some((id) => typeof id !== "string")
  ) {
    return NextResponse.json(
      { error: "offerIds must be a non-empty array of strings" },
      { status: 400 },
    );
  }

  if (offerIds.length > MAX_OFFER_IDS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_OFFER_IDS} offers per batch` },
      { status: 400 },
    );
  }

  const adminId = session.user.id ?? "";

  const handlers: Record<BatchAction, () => ReturnType<typeof batchVerifyHiredOffers>> = {
    verify: () => batchVerifyHiredOffers({ adminId, offerIds }),
    deactivate: () => batchDeactivateHiredOffers({ adminId, offerIds }),
    mark_unverifiable: () => batchMarkUnverifiable({ adminId, offerIds }),
  };

  try {
    const result = await handlers[action as BatchAction]();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/admin/hired/offers/batch]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
