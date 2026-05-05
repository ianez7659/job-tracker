import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeLevel } from "@/lib/xp/levels";

export async function GET() {
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

  const xp = await prisma.userXp.findUnique({
    where: { userId: user.id },
    select: { totalXp: true },
  });

  const totalXp = xp?.totalXp ?? 0;
  const levelInfo = computeLevel(totalXp);

  return NextResponse.json({
    totalXp,
    level: levelInfo.level,
    currentLevelXp: levelInfo.currentLevelXp,
    xpToNextLevel: levelInfo.xpToNextLevel,
    progress: levelInfo.progress,
  });
}
