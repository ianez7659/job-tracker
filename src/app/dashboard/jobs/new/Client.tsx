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
  // { value: "interview", label: "Interview" },
  // { value: "offer", label: "Offer" },
  // { value: "rejected", label: "Rejected" },
];

export default function NewJobClient() {
  const router = useRouter();

  // const inputBase =
  //   "w-full px-3 py-2 border border-gray-300 rounded bg-white text-black placeholder:text-gray-400 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500";

  // const selectBase =
  //   "w-full px-3 py-2 border border-gray-300 rounded bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

  // const labelBase = "block text-sm font-medium text-black mb-1";
  // const headingBase = "text-2xl font-bold text-black my-6";
  // const buttonBase =
  //   "bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm";

  const [url, setUrl] = useState("");
  const [fetchJdError, setFetchJdError] = useState<string | null>(null);
  const [fetchJdLoading, setFetchJdLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company: "",
    status: "resume",
    tags: "",
    url: "",
    jd: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "url") setFetchJdError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagsArray = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const jobData = {
      ...form,
      tags: tagsArray,
    };

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to create job");

      setForm({
        title: "",
        company: "",
        status: "resume",
        tags: "",
        url: "",
        jd: "",
      });
      setFetchJdError(null);

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Submission failed");
    }
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

  return (
    <section className="max-w-xl mx-auto mt-14 p-6 bg-white rounded shadow">
      <a
        href="/dashboard"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
      >
        Back to Dashboard
      </a>
      <h1 className={headingBase}>Applying Position</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <p className="text-sm text-amber-600 mt-1">
              {fetchJdError}
            </p>
          )}
        </div>
        <select
          name="title"
          value={form.title}
          onChange={handleChange}
          className={selectBase}
          required
        >
          <option value="">Select position</option>
          {titleOptions.map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>
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
          {statusOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="Tags (comma-separated)"
          className={inputBase}
        />
        <button type="submit" className={buttonBase}>
          Submit
        </button>
      </form>
    </section>
  );
}
