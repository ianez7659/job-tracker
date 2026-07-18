"use client";

import { Flame, Zap } from "lucide-react";
import Reveal from "./Reveal";
import CountUp from "./CountUp";

export default function StreakSection() {
  return (
    <section className="border-t border-line bg-canvas">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-8 md:grid-cols-2 md:gap-16">
        {/* Preview panel first on desktop, second on mobile handled by order */}
        <Reveal delay={0.1} className="order-2 md:order-1">
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-line bg-canvas p-5">
                <div className="flex items-center gap-2 text-streak">
                  <Flame size={16} />
                  <span className="font-mono text-xs uppercase tracking-wider">Streak</span>
                </div>
                <p className="mt-3 font-mono text-4xl font-bold text-ink">
                  <CountUp to={12} />
                </p>
                <p className="mt-1 text-xs text-ink-muted">days in a row</p>
              </div>
              <div className="rounded-xl border border-line bg-canvas p-5">
                <div className="flex items-center gap-2 text-signal">
                  <Zap size={16} />
                  <span className="font-mono text-xs uppercase tracking-wider">XP today</span>
                </div>
                <p className="mt-3 font-mono text-4xl font-bold text-ink">
                  +<CountUp to={40} />
                </p>
                <p className="mt-1 text-xs text-ink-muted">from today&rsquo;s missions</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-line bg-canvas p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">Daily drill</p>
              <p className="mt-2 text-sm font-medium text-ink">
                &ldquo;Tell me about a time you handled conflict on a team.&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full w-3/5 rounded-full bg-streak" />
                </div>
                <span className="font-mono text-xs text-ink-muted">3 / 5</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="order-1 md:order-2">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-streak">
            02 / Momentum
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            Stay in the game
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
            Searching for a job is a marathon. Daily missions, an interview drill, and a streak that
            grows each day you show up turn the grind into steady progress — and XP you can watch
            climb.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
