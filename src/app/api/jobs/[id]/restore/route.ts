import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  await prisma.job.update({
    where: { id },
    data: { deletedAt: null },
  });

  return NextResponse.json({ success: true });
}
