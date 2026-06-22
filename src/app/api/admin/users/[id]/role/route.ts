import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminSession } from "@/domains/admin/require-admin";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/domains/admin/activityLog";

const VALID_STATUSES = ["STUDENT", "ALUMNI", "STAFF"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super admins may change roles
  if (!session.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: targetId } = await params;

  // Prevent self-demotion to avoid admin lock-out
  if (session.user.id === targetId) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const hubStatus =
    body && typeof body === "object" && "hubStatus" in body
      ? (body as Record<string, unknown>).hubStatus
      : undefined;

  if (!VALID_STATUSES.includes(hubStatus as ValidStatus)) {
    return NextResponse.json(
      { error: `hubStatus must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  // Prevent removing the last STAFF account
  if (hubStatus !== "STAFF") {
    const staffCount = await prisma.user.count({
      where: { hubStatus: "STAFF" },
    });
    if (staffCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last STAFF account" },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { hubStatus: hubStatus as ValidStatus },
    select: { id: true, email: true, hubStatus: true },
  });

  // Invalidate admin user caches so the next page load reflects the change
  revalidateTag("admin-users-detailed");
  revalidateTag("admin-user-detail");

  createActivityLog({
    adminId: session.user.id,
    action: "user_role_changed",
    targetType: "user",
    targetId,
    metadata: { newRole: updated.hubStatus, targetEmail: updated.email },
  }).catch(() => {});

  return NextResponse.json(updated);
}
