import type { Metadata } from "next";
import WelcomePageClient from "./WelcomePageClient";

export const metadata: Metadata = {
  title: "Welcome — Jobflow",
  description:
    "Keep track of your job applications with ease and clarity. Try the demo or sign in.",
};

export default function WelcomePage() {
  return <WelcomePageClient />;
}
