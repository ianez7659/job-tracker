import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "Jobflow — Your job search, on rails",
  description:
    "Move every application one checkpoint at a time — applied, interviewing, offer. Guided pipeline, daily drills, and interview prep in one place.",
};

export default function HomePage() {
  return <HomePageClient />;
}
