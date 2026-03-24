import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ReactNode } from "react";
import SessionProvider from "@/components/provider/SessionWraper";
// import PageTransition from "@/components/PageTransition";
import ThemeProvider from "@/components/ThemeProvider";

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

const themeScript = `
(function() {
  var t = null;
  try { t = localStorage.getItem('theme'); } catch (e) {}
  var d = false;
  try { d = window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) {}
  if (t === 'dark' || (t !== 'light' && d)) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <ThemeProvider>
          <SessionProvider>
            {/* <PageTransition>{children}</PageTransition> */}
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
