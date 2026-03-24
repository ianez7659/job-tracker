"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  inputBase,
  selectBase,
  labelBase,
  headingBase,
  buttonBase,
} from "@/lib/styles";
import { POSITION_LEVELS } from "@/lib/constants/positions";

type Job = {
  id: string;
  title: string;
  company: string;
  status: string;
  appliedAt: string;
  tags: string | null;
  url?: string | null;
  jd?: string | null;
  resumeFile?: string | null;
};

type Props = {
  job: Job;
};

export default function ApplyJobClient({ job }: Props) {
  const router = useRouter();

  const [fetchJdError, setFetchJdError] = useState<string | null>(null);
  const [fetchJdLoading, setFetchJdLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<{
    score: number;
    summary: string;
    matchedSkills: string[];
    missingSkills: string[];
    scoreDelta: number | null;
  } | null>(null);

  const [form, setForm] = useState({
    title: job.title,
    company: job.company,
    url: job.url || "",
    jd: job.jd || "",
    tags: job.tags || "",
    resumeFile: job.resumeFile || "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
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

    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        tags: tagsArray,
        jd: form.jd?.trim() || null,
        resumeFile: form.resumeFile?.trim() || null,
        // Keep current pipeline stage; only "Confirm & Mark as Applied" moves applying → resume
        status: job.status,
      }),
    });

    if (!res.ok) {
      alert("Failed to apply");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
  };

  const handleResumeFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf =
      file.type === "application/pdf" ||
      file.type === "application/x-pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setResumeUploadError("Only PDF files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeUploadError("File size must be 5MB or less.");
      return;
    }
    setResumeUploadError(null);
    setResumeUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/jobs/${job.id}/resume`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setResumeUploadError(data.error || "Upload failed.");
        return;
      }
      if (data.url) {
        setForm((prev) => ({ ...prev, resumeFile: data.url }));
      }
    } catch {
      setResumeUploadError("An error occurred while uploading.");
    } finally {
      setResumeUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveResume = async () => {
    if (!form.resumeFile) return;
    setResumeUploadError(null);
    setMatchResult(null);
    setMatchError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          company: form.company,
          status: job.status,
          tags: form.tags,
          url: form.url,
          jd: form.jd,
          resumeFile: "",
        }),
      });
      if (res.ok) {
        setForm((prev) => ({ ...prev, resumeFile: "" }));
      }
    } catch {
      setResumeUploadError("Failed to remove resume.");
    }
  };

  const handleRunMatch = async () => {
    if (!job.id) return;
    setMatchError(null);
    setMatchResult(null);
    if (!form.jd?.trim()) {
      setMatchError("Add a job description first for better matching.");
      return;
    }
    if (!form.resumeFile) {
      setMatchError("Attach a resume file first.");
      return;
    }
    setMatchLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`/api/jobs/${job.id}/match`, {
        method: "POST",
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
      const data = await res.json();
      if (!res.ok) {
        setMatchError(data.message || "Failed to run skills match.");
        return;
      }
      setMatchResult({
        score: data.score ?? 0,
        summary: data.summary ?? "",
        matchedSkills: Array.isArray(data.matchedSkills) ? data.matchedSkills : [],
        missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills : [],
        scoreDelta: typeof data.scoreDelta === "number" ? data.scoreDelta : null,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setMatchError("Matching timed out. Please try again.");
      } else {
        setMatchError("Failed to run skills match.");
      }
    } finally {
      setMatchLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);

    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "resume",
        resumeFile: form.resumeFile?.trim() || null,
      }),
    });

    if (!res.ok) {
      alert("Failed to apply");
      setSubmitting(false);
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

      {/* Card: left = apply form, right = placeholder for future content */}
      <div className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-600">
          <div className="flex items-center justify-between gap-4">
            <h1 className={headingBase}>Apply for Position</h1>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-500 dark:text-gray-200 dark:hover:bg-slate-700"
                >
                  Edit
                </button>
              )}
              {!isEditing && job.status === "applying" && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="px-3 py-1.5 text-sm rounded bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Applying..." : "Confirm & Mark as Applied"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-stretch min-h-[32rem]">
          {/* Left: view or form */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 border-r-0 lg:border-r border-gray-200 dark:border-slate-600">
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
                    Job Posting URL
                  </p>
                  {form.url ? (
                    <a
                      href={form.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 dark:text-yellow-400 underline break-all inline-block max-w-full"
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
                    {POSITION_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
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
                    <p className="text-sm text-amber-600 mt-1">{fetchJdError}</p>
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

                <input
                  type="text"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="Tags (comma-separated)"
                  className={inputBase}
                />

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`${buttonBase} disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {submitting ? "Saving..." : "Save"}
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

          {/* Right: resume attachment */}
          <div className="flex-1 min-w-0 min-h-[16rem] p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/30 flex items-start">
            <div className="w-full max-w-md space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Attach Resume
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Select a PDF file to upload. (Max 5MB)
              </p>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleResumeFileChange}
                disabled={resumeUploading}
                className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 dark:file:bg-slate-700 dark:file:text-yellow-300 hover:file:bg-indigo-100 dark:hover:file:bg-slate-600"
              />
              {resumeUploading && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Uploading…
                </p>
              )}
              {resumeUploadError && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {resumeUploadError}
                </p>
              )}
              {form.resumeFile && (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={form.resumeFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-indigo-600 dark:text-yellow-400 hover:underline"
                    >
                      Open attached resume
                    </a>
                    <button
                      type="button"
                      onClick={handleRemoveResume}
                      className="text-xs text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>

                  {/* AI skills match */}
                  <div className="mt-3 border-t border-gray-200 dark:border-slate-700 pt-3">
                    <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 uppercase tracking-wide">
                      AI skills match
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                      Compare this resume against the saved job description and get a skills match score.
                    </p>
                    <button
                      type="button"
                      onClick={handleRunMatch}
                      disabled={matchLoading}
                      className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500 text-indigo-600 dark:text-yellow-300 dark:border-yellow-400 px-3 py-1.5 text-xs font-medium hover:bg-indigo-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {matchLoading ? "Analyzing…" : "Run skills match"}
                    </button>
                    {matchError && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                        {matchError}
                      </p>
                    )}
                    {matchResult && (
                      <div className="mt-2 rounded-md border border-gray-200 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 p-2 space-y-1.5">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                          Match score:{" "}
                          <span className="text-indigo-600 dark:text-yellow-300">
                            {matchResult.score}
                          </span>
                          /100
                        </p>
                        {matchResult.scoreDelta !== null ? (
                          <p
                            className="text-[11px] text-gray-600 dark:text-gray-300"
                          >
                            Score delta vs previous run:{" "}
                            <span
                              className={
                                matchResult.scoreDelta > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : matchResult.scoreDelta < 0
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-gray-600 dark:text-gray-300"
                              }
                            >
                              {matchResult.scoreDelta > 0
                                ? `+${matchResult.scoreDelta}`
                                : String(matchResult.scoreDelta)}
                            </span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            First match run (no previous snapshot).
                          </p>
                        )}
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {matchResult.summary}
                        </p>
                        {matchResult.matchedSkills.length > 0 && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-300">
                            <span className="font-semibold">Strong skills:</span>{" "}
                            {matchResult.matchedSkills.join(", ")}
                          </p>
                        )}
                        {matchResult.missingSkills.length > 0 && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-300">
                            <span className="font-semibold">Gaps to improve:</span>{" "}
                            {matchResult.missingSkills.join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

