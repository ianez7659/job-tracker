"use client";

import { FilePlus2, ListChecks, PartyPopper } from "lucide-react";
import Reveal from "./Reveal";

const STEPS = [
  {
    icon: FilePlus2,
    title: "Add a job",
    body: "Paste a link or type the details. A card is created in seconds, ready to track.",
  },
  {
    icon: ListChecks,
    title: "Track progress",
    body: "Move each card one checkpoint at a time as you hear back — applied, interviewing, offer.",
  },
  {
    icon: PartyPopper,
    title: "Get hired",
    body: "Land the offer and keep it on record. Your hired profile saves the details and every offer to compare.",
  },
] as const;

export default function HowItWorksSection() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-line bg-canvas">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <Reveal className="text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-signal">
            02 / How it works
          </p>
          <h2 className="mx-auto mt-4 max-w-xl font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            Three steps, start to hired
          </h2>
        </Reveal>

        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={0.06 * (i + 1)} as="li">
              <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal font-mono text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-signal/30 bg-signal/10 text-signal">
                    <Icon size={18} />
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
