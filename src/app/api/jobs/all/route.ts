import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("🔍 GET /api/jobs/all - Starting request");
    const session = await getServerSession(authOptions);
    console.log("🔍 Session:", session ? { email: session.user?.email, name: session.user?.name } : "null");

    if (!session?.user?.email) {
      console.log("❌ Unauthorized - no session or email");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Attempting to fetch all jobs from database...");
    const jobs = await prisma.job.findMany({
      where: {
        user: { email: session.user.email },
        // Exclude jobs with status 'offer' and 'rejected'
      },
    });

    console.log("✅ Successfully fetched all jobs:", jobs.length);
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("❌ Error fetching all jobs:", error);
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
