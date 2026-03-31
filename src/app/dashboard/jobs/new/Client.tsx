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
import { ClipboardPasteButton } from "@/components/ClipboardPasteButton";

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
    status: "applying",
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

      router.push("/dashboard?jobCreated=1");
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
    <section className="max-w-5xl mx-auto mt-8 p-4 sm:p-6">
      <a
        href="/dashboard"
        className="inline-block bg-indigo-500 dark:bg-yellow-500 text-white px-4 py-2 rounded hover:bg-indigo-600 dark:hover:bg-yellow-600 text-sm mb-6"
      >
        Back to Dashboard
      </a>

      {/* Card: left = form, right = placeholder for future content */}
      <div className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-600">
          <h1 className={headingBase}>Applying Position</h1>
        </div>

        <div className="flex flex-col lg:flex-row min-h-[32rem]">
          {/* Left: form */}
          <div className="flex-1 p-4 sm:p-6 border-r-0 lg:border-r border-gray-200 dark:border-slate-600">
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
                  <ClipboardPasteButton
                    onText={(text) => {
                      setFetchJdError(null);
                      setForm((prev) => ({ ...prev, jd: text }));
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Copy the JD on the posting page, then tap Paste.
                </p>
                <textarea
                  id="jd"
                  name="jd"
                  value={form.jd}
                  onChange={handleChange}
                  placeholder="Paste the job description here (for AI features later)."
                  rows={8}
                  className={`${inputBase} resize-y min-h-[12rem] text-base sm:text-sm`}
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
          </div>

          {/* Right: placeholder for future content */}
          <div className="flex-1 min-h-[16rem] lg:min-h-0 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center">
              Content area — reserved for future use
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
