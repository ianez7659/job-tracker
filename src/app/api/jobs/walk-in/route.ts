import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { JobSource } from "@/generated/prisma";

/**
 * Walk-in/mobile card flow creation endpoint.
 * Uses same Job table. Skips the standard "applying" / PDF-apply gate — starts at `resume`
 * (shown as APPLIED) so the pipeline matches in-person card capture, not online posting.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      title?: string;
      company?: string;
      notes?: string | null;
      nextAction?: string | null;
    };

    const title = body.title?.trim();
    const company = body.company?.trim();

    if (!title || !company) {
      return NextResponse.json(
        { message: "Missing required fields: title, company" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const noteLines = [
      body.notes?.trim() || null,
      body.nextAction?.trim() ? `Next action: ${body.nextAction.trim()}` : null,
    ].filter(Boolean) as string[];

    const job = await prisma.job.create({
      data: {
        title,
        company,
        status: "resume",
        appliedAt: new Date(),
        tags: "walk-in,business-card",
        source: JobSource.WALK_IN,
        url: null,
        jd: noteLines.length > 0 ? noteLines.join("\n\n") : null,
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Job created", job }, { status: 201 });
  } catch (error) {
    console.error("POST /api/jobs/walk-in error:", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Server error", error: detail },
      { status: 500 },
    );
  }
}
