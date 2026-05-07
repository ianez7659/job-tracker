import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardDailyActivity } from "@/lib/xp/service";

/**
 * POST /api/xp/daily-check
 *
 * Body (optional): `{ "timeZone": "America/Vancouver" }` — IANA timezone from
 * `Intl.DateTimeFormat().resolvedOptions().timeZone`. Used to anchor “daily” at local 05:00.
 * Idempotent — safe to call multiple times per mount.
 *
 * Response: { awarded: boolean, xpGained: number } — xpGained is actual totalXp delta from this call.
 */
export async function POST(req: Request) {
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

  let timeZone: string | undefined;
  try {
    const body = (await req.json()) as { timeZone?: unknown };
    timeZone =
      typeof body?.timeZone === "string" ? body.timeZone : undefined;
  } catch {
    /* empty body */
  }

  // Check current state before awarding so we can report whether it was newly granted
  const before = await prisma.userXp.findUnique({
    where: { userId: user.id },
    select: { totalXp: true },
  });

  await awardDailyActivity(user.id, { timeZone });

  const after = await prisma.userXp.findUnique({
    where: { userId: user.id },
    select: { totalXp: true },
  });

  const diff = (after?.totalXp ?? 0) - (before?.totalXp ?? 0);
  const xpGained = Math.max(0, diff);
  const awarded = xpGained > 0;

  return NextResponse.json({ awarded, xpGained });
}
