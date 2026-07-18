"use client";

import { Plus } from "lucide-react";
import Reveal from "./Reveal";

const FAQS = [
  {
    q: "How does the guided pipeline work?",
    a: "Each application moves one checkpoint at a time — applying, applied, interview rounds, then offer or rejected. You can't skip steps, so the board always reflects reality.",
  },
  {
    q: "What keeps me coming back day to day?",
    a: "Daily missions, an interview drill, and a streak that grows each day you show up. XP tracks the effort you're putting in, not just the outcomes.",
  },
  {
    q: "Can it help me prepare for a specific role?",
    a: "Yes. Match your resume against a posting, gather a company's essentials before an interview, and scan business cards into your contacts.",
  },
  {
    q: "What happens after I get an offer?",
    a: "Your hired profile and offer details are saved so you can compare offers and keep a record of the win.",
  },
];

export default function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-line bg-canvas-alt">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
        <Reveal>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-signal">
            05 / Questions
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            Good to know
          </h2>
        </Reveal>

        <div className="mt-10 divide-y divide-line border-y border-line">
          {FAQS.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 0.05} as="div">
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm text-left font-display text-lg font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal">
                  {faq.q}
                  <Plus
                    size={18}
                    className="shrink-0 text-ink-muted transition-transform group-open:rotate-45"
                  />
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">{faq.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
