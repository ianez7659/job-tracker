import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import MobileNav from "@/components/MobileNav";
import CategoryGuard from "./CategoryGuard";

export const metadata: Metadata = {
  title: "Dashboard - Jobflow",
  description: "Manage your job applications, track interview progress, and analyze your job search statistics.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen pt-16 pb-16 bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-950 dark:to-slate-500">
        <CategoryGuard session={session}>{children}</CategoryGuard>
      </div>
      <MobileNav />
    </>
  );
}
