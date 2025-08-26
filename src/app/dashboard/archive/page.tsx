import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ArchiveClient from "./Client";

export default async function ArchivePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return notFound();

  const jobs = await prisma.job.findMany({
    where: {
      user: { email: session.user.email },
      status: { in: ["offer", "rejected"] },
      // deletedAt: null,
    },
    orderBy: { appliedAt: "desc" },
  });

  console.log(jobs);
  return <ArchiveClient jobs={jobs} />;
}
