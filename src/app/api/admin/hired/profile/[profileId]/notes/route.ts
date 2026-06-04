import { NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { updateHiredProfileNotes } from "@/domains/hired/admin-service";

/**
 * PATCH /api/admin/hired/profile/[profileId]/notes
 *
 * Admin-only: updates the notes field of a HiredProfile.
 * Body: { notes: string | null }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profileId } = await params;

  let body: { notes?: unknown };
  try {
    body = (await req.json()) as { notes?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!("notes" in body)) {
    return NextResponse.json({ error: "notes field is required" }, { status: 400 });
  }

  const notes = body.notes;
  if (notes !== null && typeof notes !== "string") {
    return NextResponse.json({ error: "notes must be a string or null" }, { status: 400 });
  }

  try {
    const profile = await updateHiredProfileNotes({
      adminId: session.user.id ?? "",
      profileId,
      notes: notes as string | null,
    });
    return NextResponse.json({ profile });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "PROFILE_NOT_FOUND") {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    console.error("[PATCH /api/admin/hired/profile/[profileId]/notes]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
