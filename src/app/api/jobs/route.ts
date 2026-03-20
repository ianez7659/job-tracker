import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { title, company, status, tags, url, jd } = body;

    // Validate required fields (appliedAt is set automatically to now)
    if (!title || !company || !status) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 },
      );
    }

    const session = await getServerSession(authOptions);

    console.log("Logged in as:", session?.user?.email);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const job = await prisma.job.create({
      data: {
        title,
        company,
        status,
        appliedAt: new Date(),
        tags: tags?.join(",") || null,
        url: url?.trim() || null,
        jd: (typeof jd === "string" ? jd.trim() : null) || null,
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Job created", job }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        message: "Server error",
        error: detail,
      },
      { status: 500 },
    );
  }
}

// GET: Fetch all jobs for the authenticated user
export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { message: "Failed to fetch jobs", error: "DATABASE_URL is not set" },
        { status: 500 }
      );
    }
    const session = await getServerSession(authOptions);
    console.log("🔍 Session:", session ? { email: session.user?.email, name: session.user?.name } : "null");

    if (!session?.user?.email) {
      console.log("❌ Unauthorized - no session or email");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Attempting to fetch jobs from database...");
    const jobs = await prisma.job.findMany({
      where: {
        user: {
          email: session.user.email,
        },
        deletedAt: null,
        NOT: {
          status: { in: ["offer", "rejected"] }, // Offer and Rejected jobs are not included
        },
      },
      orderBy: { appliedAt: "desc" },
      select: {
        id: true,
        title: true,
        company: true,
        status: true,
        appliedAt: true,
        tags: true,
        url: true,
        jd: true,
        userId: true,
        deletedAt: true,
      },
    });

    console.log("✅ Successfully fetched jobs:", jobs.length);
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("❌ Error fetching jobs:", error);
    if (error instanceof Error) {
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return NextResponse.json(
      { message: "Failed to fetch jobs", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
