import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STALE_DAYS = 7;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const sevenDaysAgo = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

  const staleJobs = await prisma.job.findMany({
    where: {
      userId,
      status: "applying",
      createdAt: { lte: sevenDaysAgo },
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      company: true,
      status: true,
      createdAt: true,
      url: true,
      jd: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const now = Date.now();
  const jobs = staleJobs.map((j: typeof staleJobs[number]) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    status: j.status,
    createdAt: j.createdAt.toISOString(),
    daysInApplying: Math.floor((now - j.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
    hasUrl: !!j.url?.trim(),
    hasJd: !!j.jd?.trim(),
  }));

  return NextResponse.json({ jobs });
}
