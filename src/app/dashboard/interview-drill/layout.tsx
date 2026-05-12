import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Daily Interview Drill - Jobflow",
  description: "Practice 5 daily interview questions personalized to your job search.",
};

/**
 * Quiz-only layout — no Sidebar, NavBar, or MobileNav.
 * Authentication is handled here; unauthenticated users are redirected to /login.
 */
export default async function InterviewDrillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {children}
    </div>
  );
}
