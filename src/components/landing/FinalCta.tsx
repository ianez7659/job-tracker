"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import Reveal from "./Reveal";

export default function FinalCta() {
  const { data: session, status } = useSession();

  return (
    <section className="border-t border-line bg-canvas">
      <div className="mx-auto max-w-4xl px-5 py-28 text-center sm:px-8">
        <Reveal>
          {/* A tiny rail motif echoing the hero */}
          <div className="mx-auto mb-8 flex w-40 items-center justify-between" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-signal" />
            <span className="h-[2px] flex-1 bg-linear-to-r from-signal to-hired" />
            <span className="h-2.5 w-2.5 rounded-full bg-hired" />
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            Ready to get on track?
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-muted">
            Start with a single application. Watch it move, one checkpoint at a time.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {status === "loading" ? (
              <div className="h-12 w-44 animate-pulse rounded-full bg-line" aria-hidden="true" />
            ) : session ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-signal px-8 py-3.5 text-base font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-full bg-signal px-8 py-3.5 text-base font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                >
                  Start free
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-line px-8 py-3.5 text-base font-medium text-ink transition-colors hover:border-signal hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
