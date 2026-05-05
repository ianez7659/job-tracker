import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardWeeklyReview } from "@/lib/xp/service";

/**
 * POST /api/xp/weekly-review
 *
 * Awards the weekly review XP bonus (once per 7 days).
 * Idempotent: returns { awarded: false } if already earned within the last week.
 *
 * NOTE: There is no dedicated weekly review UI flow yet.
 * This endpoint is the integration point for a future stale-card review feature.
 * It can also be called manually for testing or admin purposes.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const result = await awardWeeklyReview(user.id);

  return NextResponse.json(result);
}
