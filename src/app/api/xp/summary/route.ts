import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeLevel } from "@/lib/xp/levels";
import { loadLoginStreakDisplayForUser } from "@/lib/xp/loadLoginStreakDisplay";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user =
    session.user.id != null && session.user.id !== ""
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true },
        })
      : session.user.email
        ? await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
          })
        : null;

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const timeZone = searchParams.get("timeZone") ?? undefined;

  const xp = await prisma.userXp.findUnique({
    where: { userId: user.id },
    select: { totalXp: true },
  });

  const totalXp = xp?.totalXp ?? 0;
  const levelInfo = computeLevel(totalXp);

  const streak = await loadLoginStreakDisplayForUser(user.id, timeZone);

  return NextResponse.json({
    totalXp,
    level: levelInfo.level,
    currentLevelXp: levelInfo.currentLevelXp,
    xpToNextLevel: levelInfo.xpToNextLevel,
    progress: levelInfo.progress,
    loginStreak: streak.loginStreak,
    weekDays: streak.weekDays,
  });
}
