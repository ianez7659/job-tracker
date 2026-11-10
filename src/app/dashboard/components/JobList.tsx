"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import JobCard from "@/components/JobCard";
import type { Job } from "@/generated/prisma";

const INITIAL_SIZE = 3;
const LOAD_MORE_SIZE = 5;

const cardTransition = {
  duration: 0.28,
  ease: [0.25, 0.1, 0.35, 1] as const,
};
const staggerDelay = 0.04;

type Props = {
  jobs: Job[];
  onDelete: (id: string) => void;
  onRestored?: (id: string) => void;
  /** One-tap stage advance; omitted where the list is read-only. */
  onAdvance?: React.ComponentProps<typeof JobCard>["onAdvance"];
  /** Ids whose move is waiting out its Undo window. */
  pendingIds?: ReadonlySet<string>;
  onBeforeOpen?: (id: string) => Promise<void>;
  singleColumn?: boolean;
  /** Changes when the active filter changes — triggers stagger re-animation. */
  filterKey?: string;
};

export default function JobList({
  jobs,
  onDelete,
  onRestored,
  onAdvance,
  pendingIds,
  onBeforeOpen,
  singleColumn,
  filterKey,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_SIZE);

  // Reset visible count when filter changes so we start fresh
  useEffect(() => {
    setVisibleCount(INITIAL_SIZE);
  }, [filterKey]);

  // When jobs load: show at least INITIAL_SIZE if there are jobs, or reduce if list shrank
  useEffect(() => {
    if (jobs.length < visibleCount) {
      setVisibleCount(Math.min(INITIAL_SIZE, jobs.length));
    } else if (visibleCount < INITIAL_SIZE && jobs.length > 0) {
      setVisibleCount(Math.min(INITIAL_SIZE, jobs.length));
    }
  }, [jobs.length, visibleCount]);

  const visibleJobs = jobs.slice(0, visibleCount);
  const hasMore = jobs.length > visibleCount;

  return (
    <div>
      {/* key on ul remounts the list on filter change, re-triggering stagger animation */}
      <ul key={filterKey} className={`grid gap-4 ${singleColumn ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
        {visibleJobs.map((job, index) => (
          <motion.li
            key={job.id}
            // The li carries a transform (its own stacking context), so it must
            // rise itself for a card's open menu to sit above the next card.
            className="relative has-[[aria-expanded=true]]:z-30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...cardTransition,
              delay: index * staggerDelay,
            }}
          >
            <JobCard
              {...job}
              onDelete={onDelete}
              onRestored={onRestored}
              onAdvance={onAdvance}
              advancePending={pendingIds?.has(job.id) ?? false}
              onBeforeOpen={onBeforeOpen}
            />
          </motion.li>
        ))}
      </ul>
      {hasMore && (
        <motion.div
          className="mt-6 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              setVisibleCount((n) => Math.min(n + LOAD_MORE_SIZE, jobs.length))
            }
            className="px-5 py-2.5 rounded-lg border border-signal text-signal hover:bg-signal/10 font-medium transition-colors"
          >
            Load more ({jobs.length - visibleCount} remaining)
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
