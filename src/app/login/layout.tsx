import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Jobflow",
  description: "Sign in to your Jobflow account to start tracking your job applications. Login with email or GitHub.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

