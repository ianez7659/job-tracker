export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditJobClient from "./EditJobClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobPage(props: PageProps) {
  const { id } = await props.params; // using await to resolve the promise
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) return notFound();

  return (
    <EditJobClient job={{ ...job, appliedAt: job.appliedAt.toISOString() }} />
  );
}
