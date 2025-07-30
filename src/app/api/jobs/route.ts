import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { title, company, status, appliedAt, tags, url } = body;

    // Validate required fields
    if (!title || !company || !status || !appliedAt) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    console.log("📧 Logged in as:", session?.user?.email);

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
        appliedAt: new Date(appliedAt),
        tags: tags?.join(",") || null,
        url: url?.trim() || null,
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Job created", job }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// GET: Fetch all jobs for the authenticated user
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const jobs = await prisma.job.findMany({
    where: {
      user: {
        email: session.user.email,
      },
      deletedAt: null,
      NOT: {
        status: { in: ["offer", "rejected"] }, // Offet and Rejected jobs are not included
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
      userId: true,
      deletedAt: true,
    },
  });

  return NextResponse.json(jobs);
}
