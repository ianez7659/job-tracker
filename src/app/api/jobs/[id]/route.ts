// import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
// import { authOptions } from "../../auth/[...nextauth]/route";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// const prisma = new PrismaClient();

export async function PATCH(req: Request, context: any) {
  console.log("✅ PATCH 호출됨");
  const { id } = context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  console.log("✅ PATCH 요청 도착:", body);

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

  const { title, company, status, appliedAt, tags, url } = body;

  if (!title || !company || !status || !appliedAt) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  const parsedDate = new Date(appliedAt);
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json(
      { message: "Invalid appliedAt date" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.job.update({
      where: { id },
      data: {
        title,
        company,
        status,
        appliedAt: parsedDate,
        tags: Array.isArray(tags) ? tags.join(",") : tags ?? null,
        url,
        deletedAt:
          status === "offer" || status === "rejected" ? new Date() : null,
      },
    });

    return NextResponse.json({ message: "Updated", job: updated });
  } catch (error) {
    console.error(" Update error:", error);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  const { id } = context.params;

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
    return new Response(JSON.stringify({ message: "서버 오류" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
