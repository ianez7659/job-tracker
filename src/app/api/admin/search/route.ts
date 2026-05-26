import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/domains/admin/require-admin";
import { getDetailedUsersForAdmin } from "@/domains/admin/users";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ users: [], applications: [] });
  }

  const lower = q.toLowerCase();

  // Users — in-memory filter on cached data (same as UsersClient)
  const allUsers = await getDetailedUsersForAdmin();
  const users = allUsers
    .filter(
      (u) =>
        (u.name ?? "").toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower),
    )
    .slice(0, 5)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      category: u.category,
      hubStatus: u.hubStatus,
    }));

  // Applications — DB ILIKE search
  const rawApps = await prisma.job.findMany({
    where: {
      deletedAt: null,
      OR: [
        { company: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ],
    },
    take: 5,
    orderBy: { appliedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const applications = rawApps.map((j) => ({
    jobId: j.id,
    title: j.title,
    company: j.company,
    status: j.status,
    userId: j.user.id,
    userName: j.user.name,
    userEmail: j.user.email,
  }));

  return NextResponse.json({ users, applications });
}
