import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import SessionProvider from "@/components/provider/SessionWraper";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "Jobflow - Job Tracking Dashboard",
  description: "Track and manage your job applications with ease. Monitor interview progress, analyze statistics, and stay organized throughout your job search journey.",
  keywords: ["job tracking", "job application", "career management", "interview tracker", "job search"],
  authors: [{ name: "Jobflow" }],
  openGraph: {
    title: "Jobflow - Job Tracking Dashboard",
    description: "Track and manage your job applications with ease. Monitor interview progress and analyze statistics.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Jobflow - Job Tracking Dashboard",
    description: "Track and manage your job applications with ease.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-slate-100">
      <body className="text-gray-900">
        <SessionProvider>
          <PageTransition>{children}</PageTransition>
        </SessionProvider>
      </body>
    </html>
  );
}
