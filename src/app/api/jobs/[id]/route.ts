import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// const prisma = new PrismaClient();

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

  // Handle status-only updates
  if (body.status && Object.keys(body).length === 1) {
    try {
      const updated = await prisma.job.update({
        where: { id },
        data: {
          status: body.status,
          deletedAt: body.status === "offer" || body.status === "rejected" ? new Date() : null,
        },
      });
      return NextResponse.json({ message: "Status updated", job: updated });
    } catch (error) {
      console.error("❌ Status update error:", error);
      return NextResponse.json({ message: "Status update failed" }, { status: 500 });
    }
  }

  const { title, company, status, tags, url, jd } = body;

  if (!title || !company || !status) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  try {
    const updated = await prisma.job.update({
      where: { id },
      data: {
        title,
        company,
        status,
        tags: Array.isArray(tags) ? tags.join(",") : tags ?? null,
        url: url ?? undefined,
        jd: typeof jd === "string" ? (jd.trim() || null) : undefined,
        deletedAt:
          status === "offer" || status === "rejected" ? new Date() : null,
      },
    });

    return NextResponse.json({ message: "Updated", job: updated });
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
