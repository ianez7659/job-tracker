"use client";

import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/landing/Hero";
import PipelineSection from "@/components/landing/PipelineSection";
import StreakSection from "@/components/landing/StreakSection";
import PrepSection from "@/components/landing/PrepSection";
import PayoffSection from "@/components/landing/PayoffSection";
import FaqSection from "@/components/landing/FaqSection";
import FinalCta from "@/components/landing/FinalCta";
import LandingFooter from "@/components/landing/LandingFooter";

export default function HomePageClient() {
  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <LandingHeader />
      <main>
        <Hero />
        <PipelineSection />
        <StreakSection />
        <PrepSection />
        <PayoffSection />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
