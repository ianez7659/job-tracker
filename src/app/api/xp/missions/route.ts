import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadMissionsPayloadForUser } from "@/lib/xp/missionsDisplay";

/**
 * GET /api/xp/missions?timeZone=America/Vancouver
 * Read-only mission list for dashboard UI (no XP grants).
 */
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
  const timeZone =
    typeof searchParams.get("timeZone") === "string"
      ? (searchParams.get("timeZone") as string)
      : undefined;

  const payload = await loadMissionsPayloadForUser(user.id, timeZone);
  return NextResponse.json(payload);
}
