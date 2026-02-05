import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistics - Jobflow",
  description: "View detailed statistics and analytics about your job applications, interview progress, and success rates.",
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

