import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { getDetailedUsersForAdmin } from "@/domains/admin/users";
import { getCategoryLabel } from "@/lib/constants/categories";

function csvCell(value: string | number | null | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function buildCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").toLowerCase();
  const track = sp.get("track") ?? "";
  const status = sp.get("status") ?? "";
  const hub = sp.get("hub") ?? "";

  const all = await getDetailedUsersForAdmin();

  const filtered = all.filter((u) => {
    if (q) {
      const name = (u.name ?? "").toLowerCase();
      const email = u.email.toLowerCase();
      const trackLabel = getCategoryLabel(u.category).toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !trackLabel.includes(q)) return false;
    }
    if (track) {
      if (track === "__not_set__") { if (u.category) return false; }
      else { if (u.category !== track) return false; }
    }
    if (status && u.employmentStatus !== status) return false;
    if (hub) {
      if (hub === "__null__") { if (u.hubStatus !== null) return false; }
      else { if (u.hubStatus !== hub) return false; }
    }
    return true;
  });

  const header = [
    "Name", "Email", "Track", "Hub Status", "Employment Status",
    "Total Jobs", "Applying", "Waiting", "Interview", "Rejected", "Offered",
    "XP", "Level", "Login Streak", "Last Active", "Joined",
  ];

  const dataRows = filtered.map((u) => [
    u.name ?? "",
    u.email,
    getCategoryLabel(u.category),
    u.hubStatus ?? "",
    u.employmentStatus,
    u.jobCounts.total,
    u.jobCounts.applying,
    u.jobCounts.waiting,
    u.jobCounts.interview,
    u.jobCounts.rejected,
    u.jobCounts.offered,
    u.totalXp,
    u.currentLevel,
    u.loginStreak,
    u.lastActiveAt ? u.lastActiveAt.toLocaleDateString("en-CA") : "",
    u.createdAt.toLocaleDateString("en-CA"),
  ]);

  const csv = buildCsv([header, ...dataRows]);
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users-${date}.csv"`,
    },
  });
}
