import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.job.findFirst({
    where: { id, user: { email: session.user.email } },
  });
  if (!existing) {
    return NextResponse.json({ message: "Job not found" }, { status: 404 });
  }

  try {
    const job = await prisma.job.delete({ where: { id } });
    return NextResponse.json({ success: true, job }, { status: 200 });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { message: "Delete failed" },
      { status: 500 }
    );
  }
}
