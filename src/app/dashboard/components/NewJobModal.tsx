"use client";

import { useState } from "react";
import {
  inputBase,
  selectBase,
  labelBase,
  buttonBase,
} from "@/lib/styles";
import { POSITION_LEVELS } from "@/lib/constants/positions";

type NewJobModalProps = {
  onClose: () => void;
  onCreated: (job: any) => void;
};

export default function NewJobModal({ onClose, onCreated }: NewJobModalProps) {
  const [fetchJdError, setFetchJdError] = useState<string | null>(null);
  const [fetchJdLoading, setFetchJdLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company: "",
    status: "applying",
    tags: "",
    url: "",
    jd: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "url") setFetchJdError(null);
  };

  const handleTryAutoFetch = async () => {
    const urlToFetch = form.url?.trim();
    if (!urlToFetch) {
      setFetchJdError("Please enter a URL first.");
      return;
    }
    setFetchJdError(null);
    setFetchJdLoading(true);
    try {
      const res = await fetch(
        `/api/jobs/fetch-jd?url=${encodeURIComponent(urlToFetch)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok) {
        setFetchJdError(
          "Could not fetch automatically. Please paste the job description.",
        );
        return;
      }
      if (data.text) {
        setForm((prev) => ({ ...prev, jd: data.text }));
      }
    } catch {
      setFetchJdError(
        "Could not fetch automatically. Please paste the job description.",
      );
    } finally {
      setFetchJdLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const tagsArray = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const jobData = {
      ...form,
      status: "applying", // Always start in Applying stage
      tags: tagsArray,
    };

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });

      const raw = await res.text();
      type CreateJobJson = {
        message?: string;
        error?: string;
        job?: unknown;
      };
      let result: CreateJobJson = {};
      try {
        result = raw ? (JSON.parse(raw) as CreateJobJson) : {};
      } catch {
        throw new Error(
          raw?.trim() || `Invalid response (HTTP ${res.status})`,
        );
      }

      if (!res.ok) {
        throw new Error(
          result.message || result.error || "Failed to create job",
        );
      }

      const created = result.job;
      if (!created || typeof created !== "object" || !("id" in created)) {
        throw new Error("Server did not return the new job. Try refreshing.");
      }

      onCreated(created);
      onClose();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to create job",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create new job"
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-gray-300 dark:border-slate-600 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-600">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            New Application
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="title" className={labelBase}>
                Position level
              </label>
              <select
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                className={selectBase}
                required
              >
                <option value="">Select position level</option>
                {POSITION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="company" className={labelBase}>
                Company name
              </label>
              <input
                id="company"
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="Company name"
                className={inputBase}
                required
              />
            </div>

            <div>
              <label htmlFor="url" className={labelBase}>
                Job Posting URL (optional)
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={form.url}
                onChange={handleChange}
                placeholder="https://example.com/job-posting"
                className={inputBase}
              />
              <p className="text-xs text-gray-500 mt-1">
                You can add a link to the job posting if available.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <label htmlFor="jd" className={labelBase}>
                  Job description (optional)
                </label>
                <button
                  type="button"
                  onClick={handleTryAutoFetch}
                  disabled={fetchJdLoading || !form.url?.trim()}
                  className="text-sm px-3 py-1.5 rounded border border-violet-500 text-violet-600 hover:bg-violet-50 dark:border-violet-400 dark:text-violet-300 dark:hover:bg-violet-900/30 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {fetchJdLoading ? "Fetching…" : "Try Auto-Fetch"}
                </button>
              </div>
              <textarea
                id="jd"
                name="jd"
                value={form.jd}
                onChange={handleChange}
                placeholder="Paste or auto-fetch the job description for AI features later."
                rows={4}
                className={`${inputBase} resize-y`}
              />
              {fetchJdError && (
                <p className="text-sm text-amber-600 mt-1">{fetchJdError}</p>
              )}
            </div>

            <div>
              <label htmlFor="tags" className={labelBase}>
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="frontend, remote, visa-sponsor"
                className={inputBase}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-500 dark:text-gray-200 dark:hover:bg-slate-700 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`${buttonBase} disabled:opacity-60 disabled:cursor-not-allowed p-2`}
              >
                {submitting ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

