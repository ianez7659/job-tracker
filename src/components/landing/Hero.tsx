"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import GuidedRail from "./GuidedRail";

export default function Hero() {
  const { data: session, status } = useSession();
  const reduceMotion = useReducedMotion();

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section className="relative overflow-hidden bg-canvas">
      <div className="mx-auto max-w-4xl px-5 pb-8 pt-20 text-center sm:px-8 sm:pt-28">
        <motion.p
          {...fade(0)}
          className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-signal"
        >
          Guided job search
        </motion.p>

        <motion.h1
          {...fade(0.08)}
          className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl"
        >
          Your job search,
          <br />
          on rails.
        </motion.h1>

        <motion.p
          {...fade(0.16)}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg"
        >
          Every application moves one step at a time — applied, interviewing, offer. No more
          scattered tabs, no more guessing what&rsquo;s next.
        </motion.p>

        <motion.div {...fade(0.24)} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {status === "loading" ? (
            <div className="h-12 w-44 animate-pulse rounded-full bg-line" aria-hidden="true" />
          ) : session ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-signal px-7 py-3 text-base font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-full bg-signal px-7 py-3 text-base font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
              >
                Start free
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-line px-7 py-3 text-base font-medium text-ink transition-colors hover:border-signal hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
              >
                Log in
              </Link>
            </>
          )}
        </motion.div>
      </div>

      {/* Signature: the Guided Rail */}
      <div className="mx-auto max-w-2xl px-8 pb-24 pt-6 sm:pb-28">
        <GuidedRail />
      </div>
    </section>
  );
}
