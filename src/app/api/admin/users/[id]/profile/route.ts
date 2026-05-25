import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminSession } from "@/domains/admin/require-admin";
import { prisma } from "@/lib/prisma";
import { USER_CATEGORY_VALUES } from "@/lib/constants/categories";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: targetId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw =
    body && typeof body === "object" && "category" in body
      ? (body as Record<string, unknown>).category
      : undefined;

  // null means "clear the category"; undefined means field was not sent
  if (raw === undefined) {
    return NextResponse.json(
      { error: "category field is required" },
      { status: 400 }
    );
  }

  if (raw !== null && !USER_CATEGORY_VALUES.includes(raw as never)) {
    return NextResponse.json(
      { error: "Invalid category value" },
      { status: 400 }
    );
  }

  const category = raw as string | null;

  await prisma.user.update({
    where: { id: targetId },
    data: { category },
  });

  revalidateTag("admin-users-detailed");
  revalidateTag("admin-user-detail");

  return NextResponse.json({ ok: true });
}
