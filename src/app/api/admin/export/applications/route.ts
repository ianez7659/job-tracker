import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { getApplicationsPageForAdmin } from "@/domains/admin/applications";
import type { ApplicationsPageParams } from "@/domains/admin/applications";
import { getCategoryLabel } from "@/lib/constants/categories";

function csvCell(value: string | number | boolean | null | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function buildCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;

  const params: ApplicationsPageParams = {
    q: sp.get("q") || undefined,
    status: sp.get("status") || undefined,
    track: sp.get("track") || undefined,
    sort: (sp.get("sort") as ApplicationsPageParams["sort"]) || undefined,
    dir: (sp.get("dir") as ApplicationsPageParams["dir"]) || undefined,
    page: 1,
    perPage: 10000,
  };

  const { applications } = await getApplicationsPageForAdmin(params);

  const header = [
    "User Name", "User Email", "Track",
    "Company", "Title", "Status",
    "Applied At", "Updated At",
    "Has URL", "Has JD", "Has Notes",
  ];

  const STATUS_LABELS: Record<string, string> = {
    applying: "Applying",
    resume: "Waiting",
    interview1: "Interview 1",
    interview2: "Interview 2",
    interview3: "Interview 3",
    offer: "Offered",
    rejected: "Rejected",
  };

  const dataRows = applications.map((a) => [
    a.userName ?? "",
    a.userEmail,
    getCategoryLabel(a.userCategory),
    a.company,
    a.title,
    STATUS_LABELS[a.status] ?? a.status,
    a.appliedAt.toLocaleDateString("en-CA"),
    a.updatedAt.toLocaleDateString("en-CA"),
    a.hasUrl ? "Yes" : "No",
    a.hasJd ? "Yes" : "No",
    a.hasNotes ? "Yes" : "No",
  ]);

  const csv = buildCsv([header, ...dataRows]);
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="applications-${date}.csv"`,
    },
  });
}
