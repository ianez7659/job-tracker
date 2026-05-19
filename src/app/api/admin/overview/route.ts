import { NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { getAdminOverview } from "@/domains/admin/overview";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await getAdminOverview();
  return NextResponse.json(data);
}
