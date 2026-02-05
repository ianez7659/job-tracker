import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "Welcome to Jobflow - Job Tracking Dashboard",
  description: "Keep track of your job applications with ease and clarity. Start managing your job search journey today.",
};

export default function HomePage() {
  return <HomePageClient />;
}
