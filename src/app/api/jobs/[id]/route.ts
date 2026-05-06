import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { isAllowedStatusTransition } from "@/lib/jobPipeline";
import { deriveCycleEndStage } from "@/lib/xp/cycleStage";
import { awardForCycleCompletion, awardDailyActivity } from "@/lib/xp/service";
import { grantsForCycleCompletion } from "@/lib/xp/rewards";

const TERMINAL = new Set(["offer", "rejected"]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  console.log("✅ PATCH called");
  try {
    const { id } = await params;
    console.log("✅ ID extracted:", id);

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("✅ PATCH requested:", body);

    const existing = await prisma.job.findFirst({
      where: { id, user: { email: session.user.email } },
    });

    if (!existing) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    // soft delete
    if (body.softDelete === true) {
      try {
        const updated = await prisma.job.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
        return NextResponse.json({ message: "Soft deleted", job: updated });
      } catch (error) {
        console.error(" Soft delete error:", error);
        return NextResponse.json(
          { message: "Soft delete failed" },
          { status: 500 }
        );
      }
    }

    // Apply page: finish applying → resume with optional resume file only
    const bodyKeys = Object.keys(body).sort();
    if (
      bodyKeys.length === 2 &&
      bodyKeys[0] === "resumeFile" &&
      bodyKeys[1] === "status" &&
      body.status === "resume"
    ) {
      if (!isAllowedStatusTransition(existing.status, "resume")) {
        return NextResponse.json(
          { message: "Invalid status transition" },
          { status: 400 }
        );
      }
      try {
        const updated = await prisma.job.update({
          where: { id },
          data: {
            status: "resume",
            deletedAt: null,
          },
        });
        // Only write resumeFile when the client sends a non-empty URL. null/"" means "no change":
        // avoids wiping a URL that was set by POST /resume while React state was still empty.
        const rf = body.resumeFile;
        if (typeof rf === "string" && rf.trim() !== "") {
          try {
            await prisma.job.update({
              where: { id },
              data: { resumeFile: rf.trim() },
            });
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            if (
              !msg.includes("42703") &&
              !msg.includes("P2022") &&
              !(msg.includes("resumeFile") && msg.includes("does not exist"))
            ) {
              throw e;
            }
          }
        }
        const fresh = await prisma.job.findFirst({ where: { id } });
        return NextResponse.json({ message: "Updated", job: fresh ?? updated });
      } catch (error) {
        console.error("❌ Apply confirm error:", error);
        return NextResponse.json({ message: "Update failed" }, { status: 500 });
      }
    }

    // Handle status-only updates
    if (body.status && Object.keys(body).length === 1) {
      if (!isAllowedStatusTransition(existing.status, body.status)) {
        return NextResponse.json(
          { message: "Invalid status transition" },
          { status: 400 }
        );
      }
      try {
        const newStatus: string = body.status;
        const isTerminal = TERMINAL.has(newStatus);
        const cycleEndStage = isTerminal
          ? deriveCycleEndStage(existing.status)
          : undefined;

        const updated = await prisma.job.update({
          where: { id },
          data: {
            status: newStatus,
            deletedAt: isTerminal ? new Date() : null,
            ...(cycleEndStage !== undefined && { cycleEndStage }),
          },
        });

        const cycleJob = {
          id: existing.id,
          company: existing.company,
          title: existing.title,
          status: newStatus,
          appliedAt: existing.appliedAt,
          url: existing.url ?? null,
          jd: existing.jd ?? null,
          cycleEndStage: cycleEndStage ?? null,
        };

        if (isTerminal) {
          void awardForCycleCompletion(existing.userId, cycleJob);
        } else {
          void awardDailyActivity(existing.userId);
        }

        const xpGained = isTerminal
          ? grantsForCycleCompletion(cycleJob).reduce((s, g) => s + g.amount, 0)
          : 0;

        return NextResponse.json({ message: "Status updated", job: updated, xpGained });
      } catch (error) {
        console.error("❌ Status update error:", error);
        return NextResponse.json({ message: "Status update failed" }, { status: 500 });
      }
    }

    const { title, company, status, tags, url, jd, resumeFile } = body;

    if (!title || !company || !status) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    if (!isAllowedStatusTransition(existing.status, status)) {
      return NextResponse.json(
        { message: "Invalid status transition" },
        { status: 400 }
      );
    }

    try {
      const isTerminal = TERMINAL.has(status);
      const cycleEndStage = isTerminal
        ? deriveCycleEndStage(existing.status)
        : undefined;

      const updated = await prisma.job.update({
        where: { id },
        data: {
          title,
          company,
          status,
          tags: Array.isArray(tags) ? tags.join(",") : tags ?? null,
          url: url ?? undefined,
          jd: typeof jd === "string" ? jd.trim() || null : undefined,
          deletedAt: isTerminal ? new Date() : null,
          ...(cycleEndStage !== undefined && { cycleEndStage }),
        },
      });

      if (resumeFile !== undefined) {
        const isClear = resumeFile === null || resumeFile === "";
        const isSet = typeof resumeFile === "string" && resumeFile.trim() !== "";
        if (isClear) {
          try {
            await prisma.job.update({
              where: { id },
              data: { resumeFile: null },
            });
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            if (
              !msg.includes("42703") &&
              !msg.includes("P2022") &&
              !(msg.includes("resumeFile") && msg.includes("does not exist"))
            ) {
              throw e;
            }
          }
        } else if (isSet) {
          try {
            await prisma.job.update({
              where: { id },
              data: { resumeFile: resumeFile.trim() },
            });
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            if (
              !msg.includes("42703") &&
              !msg.includes("P2022") &&
              !(msg.includes("resumeFile") && msg.includes("does not exist"))
            ) {
              throw e;
            }
          }
        }
      }

      const fullCycleJob = {
        id: existing.id,
        company: updated.company,
        title: updated.title,
        status,
        appliedAt: updated.appliedAt,
        url: updated.url ?? null,
        jd: updated.jd ?? null,
        cycleEndStage: cycleEndStage ?? null,
      };

      if (isTerminal) {
        void awardForCycleCompletion(existing.userId, fullCycleJob);
      } else {
        void awardDailyActivity(existing.userId);
      }

      const xpGained = isTerminal
        ? grantsForCycleCompletion(fullCycleJob).reduce((s, g) => s + g.amount, 0)
        : 0;

      return NextResponse.json({ message: "Updated", job: updated, xpGained });
    } catch (error) {
      console.error(" Update error:", error);
      return NextResponse.json({ message: "Update failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("❌ PATCH error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const updated = await prisma.job.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return new Response(
      JSON.stringify({ message: "Soft deleted", job: updated }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(" Soft delete error:", error);
    return new Response(JSON.stringify({ message: "server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
