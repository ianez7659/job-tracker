"use client";

import { useState } from "react";
import type { Job } from "@/generated/prisma";
import { Trash2 } from "lucide-react";
import Link from "next/link";
// import { Job } from "@prisma/client";

type Props = {
  jobs: Job[];
};

export default function TrashClient({ jobs: initialJobs }: Props) {
  const [jobs, setJobs] = useState(initialJobs);

  const handleRestore = async (id: string) => {
    const res = await fetch(`/api/jobs/${id}/restore`, { method: "PATCH" });
    if (res.ok) {
      setJobs((prev) => prev.filter((job) => job.id !== id));
    }
  };

  const handlePermanentDelete = async (id: string) => {
    const confirmed = confirm(
      "Do you really want to delete this application permanently? This action cannot be undone."
    );
    if (!confirmed) return;

    const res = await fetch(`/api/jobs/${id}/permanent`, { method: "DELETE" });
    if (res.ok) {
      setJobs((prev) => prev.filter((job) => job.id !== id));
    }
  };

  return (
    <section className="p-12">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 ">
        <h1 className="text-2xl font-bold mb-4 flex flex-row items-center gap-2">
          <Trash2 size={20} /> Deleted Application List
        </h1>
        <Link
          href="/dashboard/"
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm transition-transform hover:scale-105"
        >
          Back to Dashboard
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="text-gray-500">Trash bin is empty.</p>
      ) : (
        <ul className="space-y-4 w-full sm:w-[80%]">
          {jobs.map((job) => (
            <li key={job.id} className="bg-white shadow border rounded p-4">
              <div className="font-semibold">
                {job.title} @ {job.company}
              </div>
              <div className="text-sm text-gray-500 mb-2">
                Deleted Date:{" "}
                {job.deletedAt ? new Date(job.deletedAt).toLocaleString() : "-"}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(job.id)}
                  className="px-4 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Restore
                </button>
                <button
                  onClick={() => handlePermanentDelete(job.id)}
                  className="px-4 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete permanently
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
