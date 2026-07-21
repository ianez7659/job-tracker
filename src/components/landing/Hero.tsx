"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { Route, BarChart3, Flame, Target } from "lucide-react";
import { btnPrimary, btnSecondary } from "./buttonStyles";

// Hero feature chips — each points at a real capability and doubles as a
// table of contents for the sections below (Tracking, Progress, Momentum, Prep).
// The tone maps to the app's semantic accents so the marketing chips speak the
// same color language as the product (signal = pipeline/stats, streak = momentum,
// hired = the payoff prep drives toward).
const TONE = {
  signal: "bg-signal/10 text-signal border border-signal/30",
  streak: "bg-streak/12 text-streak border border-streak/30",
  hired: "bg-hired/12 text-hired border border-hired/30",
} as const;

const FEATURES = [
  { icon: Route, label: "Guided pipeline", tone: "signal" },
  { icon: BarChart3, label: "Progress at a glance", tone: "signal" },
  { icon: Flame, label: "Daily momentum", tone: "streak" },
  { icon: Target, label: "Interview prep", tone: "hired" },
] as const;

// Phone drop-in timing (seconds). FALL_LAND is when the phone first hits the
// ground (0.7 through the fall keyframes) — the shadow and ripple fire then.
const FALL_DELAY = 0.15;
const FALL_DURATION = 0.55;
const FALL_LAND = FALL_DELAY + FALL_DURATION * 0.7;

export default function Hero() {
  const { data: session, status } = useSession();
  const reduceMotion = useReducedMotion();

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduceMotion ? 0 : 0.6,
      delay: reduceMotion ? 0 : delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <section className="relative overflow-hidden bg-canvas">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 md:grid-cols-2 md:gap-8">
        {/* Left: message */}
        <div className="text-center md:text-left">
          <motion.p
            {...fade(0)}
            className="inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.18em] text-signal"
          >
            Guided job search
          </motion.p>

          <motion.h1
            {...fade(0.08)}
            className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl"
          >
            Your job search,
            <br />
            on rails.
          </motion.h1>

          <motion.p
            {...fade(0.16)}
            className="mx-auto mt-6 max-w-md text-base leading-relaxed text-ink-muted md:mx-0 sm:text-lg"
          >
            Every application moves one step at a time — applied, interviewing,
            offer. No more scattered tabs, no more guessing what&rsquo;s next.
          </motion.p>

          <motion.div
            {...fade(0.24)}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start"
          >
            {status === "loading" ? (
              <div
                className="h-12 w-44 animate-pulse rounded-full bg-line"
                aria-hidden="true"
              />
            ) : session ? (
              <Link
                href="/dashboard"
                className={`${btnPrimary} px-7 py-3 text-base`}
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login?register=1"
                  className={`${btnPrimary} px-7 py-3 text-base`}
                >
                  Start free
                </Link>
                <Link
                  href="/login"
                  className={`${btnSecondary} px-7 py-3 text-base`}
                >
                  Log in
                </Link>
              </>
            )}
          </motion.div>

          {/* Feature chips — colored nodes strung on one hairline "rail",
              echoing the "on rails" thesis. The rail only draws in the single-row
              (sm+) layout; on the 2-col mobile grid the nodes stand alone. */}
          <motion.ul
            {...fade(0.32)}
            className="mx-auto mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 md:mx-0"
          >
            {FEATURES.map(({ icon: Icon, label, tone }, i) => (
              <li
                key={label}
                className="flex flex-col items-center gap-2.5 text-center"
              >
                <div className="relative flex w-full items-center justify-center">
                  {i < FEATURES.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-1/2 top-1/2 hidden h-px w-[calc(100%+1.5rem)] -translate-y-1/2 bg-line sm:block"
                    />
                  )}
                  <span
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-lg ${TONE[tone]}`}
                  >
                    <Icon size={18} />
                  </span>
                </div>
                <span className="text-xs font-medium leading-tight text-ink-muted">
                  {label}
                </span>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Right: app preview. The device is a transparent-background mockup, so
            the phone and its shadow are separate layers: the phone drops in from
            above, and only once it lands does the ground shadow bloom outward —
            a small "settle" beat that rewards the load without looping.
            FALL_LAND marks first contact; the shadow and ripple key off it. */}
        <div className="hidden justify-center md:flex md:justify-end">
          <div className="relative w-full max-w-[480px]">
            {/* Ground shadow — invisible mid-air, blooms on impact. Rotated to
                echo the phone's tilt; two ellipses (tight core + soft ambient).
                Theme-aware so it reads on both the light and dark canvas. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-[3%] z-0 mx-auto w-[62%] -translate-x-1/2 rotate-[-7deg] left-1/2">
              <motion.div
                aria-hidden="true"
                className="relative h-6 w-full origin-center"
                initial={reduceMotion ? false : { opacity: 0, scaleX: 0.6 }}
                animate={{
                  opacity: 1,
                  scaleX: reduceMotion ? 1 : [0.6, 1.08, 1],
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.55,
                  delay: reduceMotion ? 0 : FALL_LAND,
                  ease: "easeOut",
                }}
              >
                <div className="absolute inset-0 rounded-[50%] bg-slate-900/30 blur-md dark:bg-black/60" />
                <div className="absolute -inset-x-8 -inset-y-2 rounded-[50%] bg-slate-900/15 blur-xl dark:bg-black/40" />
              </motion.div>
            </div>

            {/* Impact ripple — a single ring that expands and fades once on landing */}
            {!reduceMotion && (
              <div className="pointer-events-none absolute inset-x-0 bottom-[3%] z-0 mx-auto w-[62%] -translate-x-1/2 rotate-[-7deg] left-1/2">
                <motion.div
                  aria-hidden="true"
                  className="mx-auto h-6 w-full origin-center rounded-[50%] border border-slate-900/25 dark:border-white/20"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 0.4, 0], scale: [0.5, 1.6] }}
                  transition={{
                    duration: 0.7,
                    delay: FALL_LAND,
                    times: [0, 0.35, 1],
                    ease: "easeOut",
                  }}
                />
              </div>
            )}

            {/* The phone. Falls from above, accelerating, with a small settle bounce. */}
            <motion.div
              className="relative z-10"
              initial={reduceMotion ? false : { opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: reduceMotion ? 0 : [-50, 0, -9, 0] }}
              transition={{
                opacity: {
                  duration: reduceMotion ? 0 : 0.2,
                  delay: reduceMotion ? 0 : FALL_DELAY,
                },
                y: {
                  duration: reduceMotion ? 0 : FALL_DURATION,
                  delay: reduceMotion ? 0 : FALL_DELAY,
                  times: [0, 0.7, 0.85, 1],
                  ease: ["easeIn", "easeOut", "easeInOut"],
                },
              }}
            >
              <Image
                src="/landing/landing-phone.webp"
                alt="Jobflow on mobile — the Overview screen with application cards"
                width={640}
                height={800}
                priority
                className="h-auto w-full"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
