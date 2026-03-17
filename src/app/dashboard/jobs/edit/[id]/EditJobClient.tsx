"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  inputBase,
  selectBase,
  labelBase,
  headingBase,
  buttonBase,
  helperText,
} from "@/lib/styles";
import { POSITION_LEVELS } from "@/lib/constants/positions";

const statusOptions = [
  { value: "resume", label: "Resume" },
  { value: "interview1", label: "Interview1" },
  { value: "interview2", label: "Interview2" },
  { value: "interview3", label: "Interview3" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

type Job = {
  id: string;
  title: string;
  company: string;
  status: string;
  appliedAt: string;
  tags: string | null;
  url?: string | null;
  jd?: string | null;
};

type Props = {
  job: Job;
};

export default function EditJobClient({ job }: Props) {
  const router = useRouter();

  const [fetchJdError, setFetchJdError] = useState<string | null>(null);
  const [fetchJdLoading, setFetchJdLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: job.title,
    company: job.company,
    status: job.status,
    tags: job.tags || "",
    url: job.url || "",
    jd: job.jd || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) {
        setFetchJdError(
          "Could not fetch automatically. Please paste the job description."
        );
        return;
      }
      if (data.text) {
        setForm((prev) => ({ ...prev, jd: data.text }));
      }
    } catch {
      setFetchJdError(
        "Could not fetch automatically. Please paste the job description."
      );
    } finally {
      setFetchJdLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagsArray = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    console.log("🔍 PATCH 요청 데이터:", {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()),
    });

    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        tags: tagsArray,
        jd: form.jd?.trim() || null,
      }),
    });

    if (!res.ok) {
      alert("Failed to update job");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <section className="max-w-5xl mx-auto mt-8 p-4 sm:p-6">
      <a
        href="/dashboard"
        className="inline-block bg-indigo-500 dark:bg-yellow-500 text-white px-4 py-2 rounded hover:bg-indigo-600 dark:hover:bg-yellow-600 text-sm mb-6"
      >
        Back to Dashboard
      </a>

      {/* Card: left = details / edit form, right = placeholder for future content */}
      <div className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-600">
          <div className="flex items-center justify-between gap-4">
            <h1 className={headingBase}>Position Details</h1>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-500 dark:text-gray-200 dark:hover:bg-slate-700"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row min-h-[32rem]">
          {/* Left: view or edit form */}
          <div className="flex-1 p-4 sm:p-6 border-r-0 lg:border-r border-gray-200 dark:border-slate-600">
            {!isEditing ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Position level
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {form.title || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Company
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {form.company || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {form.status.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Job Posting URL
                  </p>
                  {form.url ? (
                    <a
                      href={form.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 dark:text-yellow-400 underline"
                    >
                      {form.url}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">Not provided</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Job description
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {form.jd || "No description"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Tags
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {form.tags || "—"}
                  </p>
                </div>
              </div>
            ) : (
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
                    {(
                      form.title &&
                      !POSITION_LEVELS.includes(
                        form.title as (typeof POSITION_LEVELS)[number],
                      )
                        ? [form.title, ...POSITION_LEVELS]
                        : [...POSITION_LEVELS]
                    ).map((value) => (
                      <option key={value} value={value}>
                        {value}
                        {value === form.title &&
                        !POSITION_LEVELS.includes(
                          value as (typeof POSITION_LEVELS)[number],
                        )
                          ? " (current)"
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="url" className={labelBase}>
                    Job Posting URL (optional)
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={form.url}
                    onChange={handleChange}
                    placeholder="https://example.com/job-posting"
                    className={inputBase}
                    required={false}
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
                    rows={6}
                    className={`${inputBase} resize-y`}
                  />
                  {fetchJdError && (
                    <p className="text-sm text-amber-600 mt-1">
                      {fetchJdError}
                    </p>
                  )}
                </div>

                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Company name"
                  className={inputBase}
                  required
                />

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={selectBase}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="tags (Using commas: React,Node.js)"
                  className={inputBase}
                />

                <div className="flex items-center gap-3">
                  <button type="submit" className={buttonBase}>
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-500 dark:text-gray-200 dark:hover:bg-slate-700 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right: placeholder for future content */}
          <div className="flex-1 min-h-[16rem] lg:min-h-0 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-center">
            <p className={helperText}>
              Content area — reserved for future use (interview notes, AI assist,
              etc.)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
