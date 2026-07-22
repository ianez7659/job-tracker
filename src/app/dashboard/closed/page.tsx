import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ClosedClient from "./Client";

export default async function ClosedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return notFound();

  const jobs = await prisma.job.findMany({
    where: {
      user: { email: session.user.email },
      status: { in: ["offer", "rejected"] },
      // No deletedAt filter on purpose: reaching a terminal status sets
      // deletedAt (see PATCH /api/jobs/[id]), so filtering deletedAt:null
      // would hide every closed application.
    },
    orderBy: { appliedAt: "desc" },
  });

  return <ClosedClient jobs={jobs} />;
}
