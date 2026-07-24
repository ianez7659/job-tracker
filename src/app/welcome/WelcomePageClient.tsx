"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { DEMO_ACCOUNT_EMAIL } from "@/lib/constants/demoAccount";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import Reveal from "@/components/landing/Reveal";
import { btnPrimary, btnSecondary } from "@/components/landing/buttonStyles";
import CardsSection from "@/components/landing/CardsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import StreakSection from "@/components/landing/StreakSection";
import PrepSection from "@/components/landing/PrepSection";
import FaqSection from "@/components/landing/FaqSection";
import FinalCta from "@/components/landing/FinalCta";

const DEMO_PASSWORD = "demo1234";

export default function WelcomePageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoSignIn = async () => {
    setDemoLoading(true);
    try {
      const res = await signIn("credentials", {
        email: DEMO_ACCOUNT_EMAIL,
        password: DEMO_PASSWORD,
        redirect: false,
      });
      if (res?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(
          "Demo sign-in failed. Create the demo user or use Log in on the main page.",
        );
      }
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <LandingHeader />

      <main>
        <section className="relative overflow-hidden bg-canvas">
          <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-24 pt-16 text-center sm:px-8 sm:pt-24">
            <Reveal>
              <p className="inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.18em] text-signal">
                Demo access
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
                Try Jobflow with a
                <br />
                demo account.
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-ink-muted sm:text-lg">
                Explore the full guided pipeline — applied, interviewing, offer —
                with sample data. No signup required.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {status === "loading" ? (
                  <div
                    className="h-12 w-52 animate-pulse rounded-xl bg-line"
                    aria-hidden="true"
                  />
                ) : session ? (
                  <Link href="/dashboard" className={`${btnPrimary} px-7 py-3 text-base`}>
                    Go to dashboard
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleDemoSignIn}
                      disabled={demoLoading}
                      className={`${btnPrimary} gap-2 px-7 py-3 text-base disabled:opacity-60`}
                    >
                      <PlayCircle size={18} aria-hidden="true" />
                      {demoLoading ? "Signing in…" : "Try demo account"}
                    </button>
                    <Link href="/login" className={`${btnSecondary} px-7 py-3 text-base`}>
                      Other sign-in options
                    </Link>
                  </>
                )}
              </div>
            </Reveal>

            {!session && (
              <Reveal delay={0.32}>
                <div className="mx-auto mt-12 w-full max-w-md rounded-2xl border border-line bg-surface p-6 text-left shadow-[0_10px_40px_-24px_rgba(20,26,36,0.35)]">
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">
                    Demo credentials
                  </p>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-ink-muted">Email</dt>
                      <dd>
                        <code className="rounded-md bg-canvas-alt px-2 py-1 font-mono text-ink">
                          {DEMO_ACCOUNT_EMAIL}
                        </code>
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-ink-muted">Password</dt>
                      <dd>
                        <code className="rounded-md bg-canvas-alt px-2 py-1 font-mono text-ink">
                          {DEMO_PASSWORD}
                        </code>
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                    Use <span className="font-medium text-ink">Try demo account</span> for
                    one-click access, or enter these on the{" "}
                    <Link
                      href="/login"
                      className="font-medium text-signal underline underline-offset-2 transition-colors hover:text-ink"
                    >
                      log in
                    </Link>{" "}
                    page.
                  </p>
                </div>
              </Reveal>
            )}
          </div>
        </section>

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
