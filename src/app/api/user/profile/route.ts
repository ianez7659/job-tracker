import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseUserProfilePatch } from "@/lib/hubProfile";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        hubStatus: true,
        headline: true,
        category: true,
      },
    });

    return NextResponse.json({ user });
  } catch (e) {
    console.error("GET /api/user/profile:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = parseUserProfilePatch(json);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { patch } = parsed;
    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.hubStatus !== undefined && { hubStatus: patch.hubStatus }),
        ...(patch.headline !== undefined && { headline: patch.headline }),
      },
      select: {
        name: true,
        hubStatus: true,
        headline: true,
        category: true,
      },
    });

    return NextResponse.json({ user });
  } catch (e) {
    console.error("PATCH /api/user/profile:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
