"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart, CheckCircle2, XCircle } from "lucide-react";
import JobCard from "@/components/JobCard";
import type { Job } from "@/generated/prisma";

type Props = {
  jobs: Job[];
};

type Tab = "offers" | "rejected";

/** Human-readable label for the last non-terminal stage a job reached before closing. */
const STAGE_LABELS: Record<string, string> = {
  applying: "Applying",
  resume: "Applied",
  interview1: "Interview 1",
  interview2: "Interview 2",
  interview3: "Interview 3",
};

function stageLabel(stage: string | null): string | null {
  if (!stage) return null;
  return STAGE_LABELS[stage] ?? stage;
}

export default function ClosedClient({ jobs: initialJobs }: Props) {
  const [jobs, setJobs] = useState(initialJobs);
  const [tab, setTab] = useState<Tab>("offers");

  // Re-sync when the server component re-renders (e.g. after an Undo → router.refresh()).
  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  const { offers, rejected } = useMemo(() => {
    return {
      offers: jobs.filter((j) => j.status === "offer"),
      rejected: jobs.filter((j) => j.status === "rejected"),
    };
  }, [jobs]);

  const visible = tab === "offers" ? offers : rejected;

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ softDelete: true }),
    });
    if (res.ok) {
      setJobs((prev) => prev.filter((j) => j.id !== id));
    }
  };

  return (
    <section className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">
            Closed Applications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {`${offers.length} offer${offers.length === 1 ? "" : "s"} · ${rejected.length} rejected`}
          </p>
        </div>
        <Link
          href="/dashboard/stats"
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <BarChart size={16} />
          See Stats
        </Link>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Closed applications"
        className="inline-flex rounded-lg border border-gray-200 dark:border-slate-600 p-1 bg-gray-50 dark:bg-slate-800 mb-6"
      >
        <button
          role="tab"
          aria-selected={tab === "offers"}
          onClick={() => setTab("offers")}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "offers"
              ? "bg-white dark:bg-slate-700 text-green-700 dark:text-green-300 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <CheckCircle2 size={16} />
          Offers ({offers.length})
        </button>
        <button
          role="tab"
          aria-selected={tab === "rejected"}
          onClick={() => setTab("rejected")}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "rejected"
              ? "bg-white dark:bg-slate-700 text-red-700 dark:text-red-300 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <XCircle size={16} />
          Rejected ({rejected.length})
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          {tab === "offers"
            ? "No offers yet. Keep going!"
            : "No rejected applications here."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visible.map((job) => {
            const reached =
              tab === "rejected" ? stageLabel(job.cycleEndStage) : null;
            return (
              <li key={job.id} className="flex flex-col gap-1">
                <JobCard {...job} onDelete={handleDelete} />
                {reached && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 pl-1">
                    Closed after: {reached}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
