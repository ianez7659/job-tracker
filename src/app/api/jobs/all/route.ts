import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { message: "Failed to fetch jobs", error: "DATABASE_URL is not set" },
        { status: 500 }
      );
    }
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const jobs = await prisma.job.findMany({
      where: {
        user: { email: session.user.email },
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching all jobs:", error);
    return NextResponse.json(
      { message: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
