"use client";

import { Target, Building2, ScanLine } from "lucide-react";
import Reveal from "./Reveal";
import CountUp from "./CountUp";

export default function PrepSection() {
  return (
    <section className="border-t border-line bg-canvas-alt">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <Reveal>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-signal">
            04 / Preparation
          </p>
          <h2 className="mt-4 max-w-xl font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            Walk in prepared
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
            Every role gets the homework it deserves — before you ever hit send or step into the
            room.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <Reveal delay={0.05}>
            <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-transform hover:-translate-y-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-signal/30 bg-signal/10 text-signal">
                <Target size={20} />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink">Resume ↔ job match</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                See how your resume lines up against each posting, with a saved snapshot of the gaps
                to close.
              </p>
              <p className="mt-5 font-mono text-sm text-signal">
                <CountUp to={82} suffix="%" /> match
              </p>
            </article>
          </Reveal>

          <Reveal delay={0.12}>
            <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-transform hover:-translate-y-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-signal/30 bg-signal/10 text-signal">
                <Building2 size={20} />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink">Know who you&rsquo;re meeting</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                Pull together a company&rsquo;s essentials so you can ask sharper questions and walk
                in informed.
              </p>
              <p className="mt-5 font-mono text-sm text-ink-muted">Company research</p>
            </article>
          </Reveal>

          <Reveal delay={0.19}>
            <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-transform hover:-translate-y-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-signal/30 bg-signal/10 text-signal">
                <ScanLine size={20} />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink">Capture every contact</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                Snap a business card and lift the details into your contacts — no retyping after a
                career fair.
              </p>
              <p className="mt-5 font-mono text-sm text-ink-muted">Card scan</p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
