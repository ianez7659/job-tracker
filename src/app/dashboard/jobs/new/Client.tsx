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
          type="date"
          name="appliedAt"
          value={form.appliedAt}
          onChange={handleChange}
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
    </section>
  );
}
