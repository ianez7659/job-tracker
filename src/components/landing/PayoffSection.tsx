"use client";

import { PartyPopper, Check } from "lucide-react";
import Reveal from "./Reveal";

export default function PayoffSection() {
  return (
    <section className="border-t border-line bg-canvas">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-8 md:grid-cols-2 md:gap-16">
        <Reveal>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-hired">
            04 / The payoff
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            Cross the line, keep the record
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
            When an offer lands, the track doesn&rsquo;t just end — it pays off. Keep your hired
            profile and every offer in one place, so the win is documented and the next decision is
            an easy one.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-hired/30 bg-surface p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-hired/12 text-hired">
                <PartyPopper size={22} />
              </span>
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-hired">Offer</p>
                <p className="font-display text-lg font-semibold text-ink">You&rsquo;re hired</p>
              </div>
            </div>

            <ul className="mt-6 space-y-3">
              {["Offer details saved to your profile", "Compare offers side by side", "Track your acceptance"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-ink">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-hired/12 text-hired">
                      <Check size={13} />
                    </span>
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
