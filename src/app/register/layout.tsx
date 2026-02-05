import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register - Jobflow",
  description: "Create a new Jobflow account to start managing your job applications and tracking your interview progress.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

