import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trash - Jobflow",
  description: "Manage deleted job applications. Restore or permanently delete applications from your trash.",
};

export default function TrashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

