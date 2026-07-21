"use client";

import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/landing/Hero";
import CardsSection from "@/components/landing/CardsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import StreakSection from "@/components/landing/StreakSection";
import PrepSection from "@/components/landing/PrepSection";
import FaqSection from "@/components/landing/FaqSection";
import FinalCta from "@/components/landing/FinalCta";
import LandingFooter from "@/components/landing/LandingFooter";

export default function HomePageClient() {
  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <LandingHeader />
      <main>
        <Hero />
        <CardsSection />
        <HowItWorksSection />
        <StreakSection />
        <PrepSection />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
