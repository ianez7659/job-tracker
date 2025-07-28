"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const [url, setUrl] = useState("");
  // const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company: "",
    status: "resume",
    appliedAt: "",
    tags: "",
    url: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
        appliedAt: "",
        tags: "",
        url: "",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Submission failed");
    }
  };

  return (
    <section className="max-w-xl mx-auto mt-4 p-6 bg-white rounded shadow">
      <a
        href="/dashboard"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
      >
        Back to Dashboard
      </a>
      <h1 className="text-2xl font-bold my-6">Applying Position</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-1">
            Job Posting URL (optional)
          </label>
          <input
            type="url"
            name="url"
            value={form.url}
            onChange={handleChange}
            placeholder="https://example.com/job-posting"
            className="border px-3 w-full py-2 rounded"
            required={false}
          />
          <p className="text-xs text-gray-500 mt-1">
            You can add a link to the job posting if available.
          </p>
        </div>
        <select
          name="title"
          value={form.title}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
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
          className="border px-3 py-2 rounded"
          required
        />
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        >
          {statusOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="appliedAt"
          value={form.appliedAt}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
          required
        />
        <input
          type="text"
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="Tags (comma-separated)"
          className="border px-3 py-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </section>
  );
}
