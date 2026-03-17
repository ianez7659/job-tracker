export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ApplyJobClient from "./Client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplyJobPage(props: PageProps) {
  const { id } = await props.params;
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) return notFound();

  return (
    <ApplyJobClient job={{ ...job, appliedAt: job.appliedAt.toISOString() }} />
  );
}

