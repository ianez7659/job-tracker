import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
      user: {
        email: session.user.email,
      },
    },
    orderBy: { deletedAt: "desc" },
  });

  return <TrashClient jobs={jobs} />;
}
