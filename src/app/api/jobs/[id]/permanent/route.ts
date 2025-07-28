import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function PATCH(req: NextRequest, context: any) {
  const { id } = context.params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const restoredJob = await prisma.job.update({
      where: { id },
      data: { deletedAt: null },
    });

    return NextResponse.json({ success: true, job: restoredJob });
  } catch (error) {
    console.error("Error restoring job:", error);
    return NextResponse.json(
      { message: "Restore failed", error: String(error) },
      { status: 500 }
    );
  }
}
