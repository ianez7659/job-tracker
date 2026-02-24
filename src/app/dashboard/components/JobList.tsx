"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import JobCard from "@/components/JobCard";
import type { Job } from "@/generated/prisma";

const INITIAL_SIZE = 10;
const LOAD_MORE_SIZE = 10;

const cardTransition = {
  duration: 0.28,
  ease: [0.25, 0.1, 0.35, 1] as const,
};
const staggerDelay = 0.04;

type Props = {
  jobs: Job[];
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (
    id: string,
    newStatus: Job["status"] | string
  ) => Promise<void>;
};

export default function JobList({ jobs, onDelete, onStatusChange }: Props) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_SIZE);

  // Reset visible count when filter/search reduces the list
  useEffect(() => {
    if (jobs.length < visibleCount) {
      setVisibleCount(Math.min(INITIAL_SIZE, jobs.length));
    }
  }, [jobs.length, visibleCount]);

  const visibleJobs = jobs.slice(0, visibleCount);
  const hasMore = jobs.length > visibleCount;

  return (
    <div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visibleJobs.map((job, index) => (
          <motion.li
            key={job.id}
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
              onStatusChange={onStatusChange}
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
            className="px-5 py-2.5 rounded-lg border border-indigo-500 text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
          >
            Load more ({jobs.length - visibleCount} remaining)
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
