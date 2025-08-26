"use client";
import JobCard from "@/components/JobCard";
import type { Job } from "@/generated/prisma";

type Props = {
  jobs: Job[];
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (
    id: string,
    newStatus: Job["status"] | string
  ) => Promise<void>;
};

export default function JobList({ jobs, onDelete, onStatusChange }: Props) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          {...job}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}
    </ul>
  );
}
