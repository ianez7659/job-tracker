"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Rocket } from "lucide-react";
import Reveal from "./Reveal";

export default function FinalCta() {
  const { data: session, status } = useSession();

  return (
    <section className="border-t border-line bg-canvas">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-signal to-[#7c6cff] px-6 py-12 text-center shadow-[0_24px_60px_-24px_rgba(79,70,229,0.55)] sm:px-12 sm:py-16">
            <span
              className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-3xl"
              aria-hidden
            />
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
              <Rocket size={24} />
            </span>
            <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              Ready to get on track?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/85">
              Start with a single application. Watch it move, one checkpoint at a time.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {status === "loading" ? (
                <div className="h-12 w-44 animate-pulse rounded-full bg-white/20" aria-hidden="true" />
              ) : session ? (
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-signal transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login?register=1"
                    className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-signal transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Start free
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-xl border-2 border-white/60 px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
