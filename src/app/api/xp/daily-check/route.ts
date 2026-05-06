import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardDailyActivity } from "@/lib/xp/service";
import { XP_DAILY_ACTIVITY } from "@/lib/xp/rewards";

/**
 * POST /api/xp/daily-check
 *
 * Called by the dashboard client on mount when local time >= 05:00.
 * Awards +8 XP once per UTC day. Idempotent — safe to call multiple times.
 *
 * Response: { awarded: boolean, xpGained: number }
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

  // Check current state before awarding so we can report whether it was newly granted
  const before = await prisma.userXp.findUnique({
    where: { userId: user.id },
    select: { totalXp: true },
  });

  await awardDailyActivity(user.id);

  const after = await prisma.userXp.findUnique({
    where: { userId: user.id },
    select: { totalXp: true },
  });

  const diff = (after?.totalXp ?? 0) - (before?.totalXp ?? 0);
  const awarded = diff >= XP_DAILY_ACTIVITY;

  return NextResponse.json({ awarded, xpGained: awarded ? XP_DAILY_ACTIVITY : 0 });
}
