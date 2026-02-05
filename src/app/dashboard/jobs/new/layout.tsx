import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add New Job - Jobflow",
  description: "Add a new job application to track. Enter job details and start monitoring your application progress.",
};

export default function NewJobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

