import { getServerSession } from "next-auth";
// import { authOptions } from "../api/auth/[...nextauth]/route";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./Client";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  console.log("✅ session", session); // debugging

  if (!session) {
    redirect("/login");
  }

  return <DashboardClient user={session.user!} />;
}
