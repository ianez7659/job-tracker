"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import StaleJobCard from "@/components/StaleJobCard";

interface StaleJob {
  id: string;
  title: string;
  company: string;
  status: string;
  createdAt: string;
  daysInApplying: number;
  url: string | null;
  hasUrl: boolean;
  hasJd: boolean;
}

export default function StaleApplyingPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<StaleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs/stale-applying", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (jobId: string) => {
    setBusyId(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ softDelete: true }),
      });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Review old Applying cards
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Job cards stuck in Applying for 7+ days
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
            No old Applying cards to review.
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You&apos;re all caught up.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <StaleJobCard
                id={job.id}
                title={job.title}
                company={job.company}
                createdAt={job.createdAt}
                daysInApplying={job.daysInApplying}
                url={job.url}
                hasUrl={job.hasUrl}
                hasJd={job.hasJd}
                onRemove={handleDelete}
                busy={busyId === job.id}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
