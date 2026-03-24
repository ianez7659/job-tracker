import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./Client";

type PageProps = {
  searchParams: Promise<{ newJob?: string | string[] }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  console.log("✅ session", session); // debugging

  if (!session) {
    redirect("/login");
  }

  const sp = await searchParams;
  const raw = sp.newJob;
  const newJobFlag = Array.isArray(raw) ? raw[0] : raw;
  const openNewJobFromQuery = newJobFlag === "1";

  return (
    <DashboardClient
      user={session.user!}
      openNewJobFromQuery={openNewJobFromQuery}
    />
  );
}
