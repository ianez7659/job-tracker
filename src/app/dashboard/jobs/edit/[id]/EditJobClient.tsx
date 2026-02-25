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
// import { url } from "inspector";

const titleOptions = [
  "Frontend Developer",
  "Backend Developer",
  "Fullstack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "etc.",
];

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
    <section className="max-w-xl shadow-md mx-auto mt-4 p-6 bg-white rounded">
      <a
        href="/dashboard"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm mb-4"
      >
        Back to Dashboard
      </a>
      <h1 className={headingBase}>Edit Position</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <select
          name="title"
          value={form.title}
          onChange={handleChange}
          className={selectBase}
          required
        >
          <option value="">Select position</option>
          {titleOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
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
              className="text-sm px-3 py-1.5 rounded border border-violet-500 text-violet-600 hover:bg-violet-50 disabled:opacity-50 disabled:pointer-events-none"
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
        <button type="submit" className={buttonBase}>
          Save Changes
        </button>
      </form>
    </section>
  );
}
