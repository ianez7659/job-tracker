// app/jobs/new/page.tsx
import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewJobClient from "./Client";

export default async function NewJobPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <NewJobClient />;
}
