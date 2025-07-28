"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  { value: "interview", label: "Interview" },
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
};

type Props = {
  job: Job;
};

export default function EditJobClient({ job }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: job.title,
    company: job.company,
    status: job.status,
    appliedAt: job.appliedAt.slice(0, 10),
    tags: job.tags || "",
    url: job.url || "",
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
      <h1 className="text-2xl font-bold mb-6">Edit Position</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <select
          name="title"
          value={form.title}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
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
          <label htmlFor="url" className="block text-sm font-medium mb-1">
            Job Posting URL (optional)
          </label>
          <input
            type="url"
            name="url"
            value={form.url}
            onChange={handleChange}
            placeholder="https://example.com/job-posting"
            className="border px-3 py-2 rounded"
            required={false}
          />
          <p className="text-xs text-gray-500 mt-1">
            ※ 현재는 자동 추출 기능 없이, URL은 기록용으로만 사용됩니다.
          </p>
        </div>
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
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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
          placeholder="tags (쉼표로 구분: React,Node.js)"
          className="border px-3 py-2 rounded"
        />
        <button
          type="submit"
          className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Save Changes
        </button>
      </form>
    </section>
  );
}
