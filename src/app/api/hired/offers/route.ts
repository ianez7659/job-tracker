import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOfferTransition } from "@/domains/hired/user-service";
import { awardForCycleCompletion } from "@/lib/xp/service";
import { grantsForCycleCompletion } from "@/lib/xp/rewards";
import {
  EMPLOYMENT_TYPES,
  WORK_ARRANGEMENTS,
  SALARY_RANGES,
} from "@/domains/hired/constants";

export async function POST(req: Request) {
  try {
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

    const body = (await req.json()) as Record<string, unknown>;
    const { jobId, offerDate, employmentType, workArrangement, salaryRange } = body;

    // --- Input validation ---
    if (typeof jobId !== "string" || !jobId) {
      return NextResponse.json({ message: "jobId is required" }, { status: 400 });
    }
    if (typeof offerDate !== "string" || !offerDate) {
      return NextResponse.json({ message: "offerDate is required" }, { status: 400 });
    }
    const parsedOfferDate = new Date(offerDate);
    if (isNaN(parsedOfferDate.getTime())) {
      return NextResponse.json({ message: "offerDate is invalid" }, { status: 400 });
    }
    if (
      typeof employmentType !== "string" ||
      !(EMPLOYMENT_TYPES as readonly string[]).includes(employmentType)
    ) {
      return NextResponse.json(
        { message: `employmentType must be one of: ${EMPLOYMENT_TYPES.join(", ")}` },
        { status: 400 },
      );
    }
    if (
      workArrangement !== undefined &&
      workArrangement !== null &&
      !(WORK_ARRANGEMENTS as readonly string[]).includes(workArrangement as string)
    ) {
      return NextResponse.json(
        { message: `workArrangement must be one of: ${WORK_ARRANGEMENTS.join(", ")}` },
        { status: 400 },
      );
    }
    if (
      salaryRange !== undefined &&
      salaryRange !== null &&
      !(SALARY_RANGES as readonly string[]).includes(salaryRange as string)
    ) {
      return NextResponse.json(
        { message: `salaryRange must be one of: ${SALARY_RANGES.join(", ")}` },
        { status: 400 },
      );
    }

    // --- Domain logic ---
    let result;
    try {
      result = await createOfferTransition({
        userId: user.id,
        jobId,
        offerDate: parsedOfferDate,
        employmentType: employmentType as (typeof EMPLOYMENT_TYPES)[number],
        workArrangement: (workArrangement as (typeof WORK_ARRANGEMENTS)[number]) ?? null,
        salaryRange: (salaryRange as (typeof SALARY_RANGES)[number]) ?? null,
      });
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "JOB_NOT_FOUND") {
        return NextResponse.json({ message: "Job not found" }, { status: 404 });
      }
      if (code === "INVALID_TRANSITION") {
        return NextResponse.json(
          { message: (err as Error).message },
          { status: 400 },
        );
      }
      throw err;
    }

    const { job, hiredOffer } = result;

    // --- XP award (fire-and-forget) ---
    const cycleJob = {
      id: job.id,
      company: job.company,
      title: job.title,
      status: "offer",
      appliedAt: job.appliedAt,
      url: job.url ?? null,
      jd: job.jd ?? null,
      cycleEndStage: job.cycleEndStage ?? null,
    };
    const xpGained = grantsForCycleCompletion(cycleJob).reduce(
      (s, g) => s + g.amount,
      0,
    );
    void awardForCycleCompletion(user.id, cycleJob);

    return NextResponse.json(
      { message: "Offer recorded", job, offerId: hiredOffer.id, xpGained },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/hired/offers]", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
