import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TERMINAL_STATUSES } from "@/lib/jobPipeline";
import TrashClient from "./TrashClient";

export default async function TrashPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const jobs = await prisma.job.findMany({
    where: {
      deletedAt: {
        not: null,
      },
      // Exclude closed jobs: reaching a terminal status also sets deletedAt,
      // so without this filter Trash would fill up with offers/rejections that
      // belong in the Closed view, not the trash bin.
      status: { notIn: [...TERMINAL_STATUSES] },
      user: {
        email: session.user.email,
      },
    },
    orderBy: { deletedAt: "desc" },
  });

  return <TrashClient jobs={jobs} />;
}
