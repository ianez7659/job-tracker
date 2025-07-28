"use client";

import { useState } from "react";
import JobCard from "@/components/JobCard";
import type { Job } from "@/generated/prisma";

type Props = {
  jobs: Job[];
};

export default function ArchiveClient({ jobs: initialJobs }: Props) {
  const [jobs, setJobs] = useState(initialJobs);

  return (
    <section className="p-4">
      <h1 className="text-xl font-bold mb-4">Archived Applications</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            {...job}
            onDelete={async (id) => {
              const res = await fetch(`/api/jobs/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ softDelete: true }),
              });
              if (res.ok) {
                setJobs((prev) => prev.filter((j) => j.id !== id));
              }
            }}
            onStatusChange={async (id, newStatus) => {
              const res = await fetch(`/api/jobs/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...job, status: newStatus }),
              });
              if (res.ok) {
                setJobs((prev) =>
                  prev.map((j) =>
                    j.id === id ? { ...j, status: newStatus } : j
                  )
                );
              }
            }}
          />
        ))}
      </ul>
    </section>
  );
}
