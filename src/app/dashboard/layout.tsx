import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
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
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen pt-16 pb-16 md:pt-6 md:pb-6 md:pl-56 bg-gradient-to-br from-indigo-200 via-white to-indigo-200 dark:from-slate-950 dark:via-slate-700 dark:to-slate-800">
          <CategoryGuard session={session}>{children}</CategoryGuard>
        </div>
      </div>
      <MobileNav />
    </>
  );
}
