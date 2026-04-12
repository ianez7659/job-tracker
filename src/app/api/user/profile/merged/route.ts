import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMergedPublicProfile } from "@/lib/mergedProfile";

/**
 * Single merged view for the current user (community-oriented display).
 * Auth required. Does not expose other users.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        category: true,
        hubStatus: true,
        headline: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const merged = buildMergedPublicProfile(user);

    return NextResponse.json({ merged });
  } catch (e) {
    console.error("GET /api/user/profile/merged:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
