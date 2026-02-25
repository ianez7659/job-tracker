"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Calendar, Building2, Link2, Sparkles, X } from "lucide-react";

type JobCardProps = {
  id: string;
  title: string;
  company: string;
  status: string;
  appliedAt?: string | Date | null;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
  url?: string | null;
  jd?: string | null;
};

export default function JobCard({
  id,
  title,
  company,
  status,
  appliedAt,
  onDelete,
  onStatusChange,
  url,
  jd,
}: JobCardProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState<"skills" | "interview" | null>(null);
  const [aiResult, setAiResult] = useState<{ skills?: string; interview?: string }>({});
  const [aiError, setAiError] = useState<string | null>(null);
  const statusColors: Record<string, string> = {
    resume: "bg-gray-200 text-gray-800",
    interview1: "bg-yellow-100 text-yellow-800",
    interview2: "bg-orange-200 text-orange-900",
    interview3: "bg-orange-400 text-orange-900",
    offer: "bg-green-200 text-green-800",
    rejected: "bg-red-200 text-red-800",
  };
  const handleAiGenerate = async (action: "skills" | "interview") => {
    setAiError(null);
    setAiLoading(action);
    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.message || "Request failed");
        return;
      }
      if (data.text) {
        setAiResult((prev) => ({ ...prev, [action]: data.text }));
      }
    } catch {
      setAiError("Request failed");
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <div className="relative rounded-xl border border-gray-400 shadow hover:shadow-lg transition bg-white overflow-hidden flex">
      {/* Status Indicator */}
      <div
        className={`w-2 sm:w-3 h-full ${statusColors[status]} absolute left-0 top-0`}
      />

      <div className="p-4 pl-6 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
            <Building2 size={14} />
            {company}
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            {appliedAt ? new Date(appliedAt).toLocaleDateString() : "No date"}
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 flex items-center gap-1 hover:underline"
            >
              <Link2 size={14} />
              Link to original posting
            </a>
          )}
        </div>

        <div className="flex justify-between items-center mt-2">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[status]}`}
          >
            {status.toUpperCase()}
          </span>
          <div className="flex items-center gap-2">
            <p className="text-sm">Status to:</p>
            <select
              value={status}
              onChange={(e) => onStatusChange?.(id, e.target.value)}
              className="text-xs border px-2 py-1 rounded bg-white"
            >
              <option value="resume">Resume</option>
              <option value="interview1">Interview1</option>
              <option value="interview2">Interview2</option>
              <option value="interview3">Interview3</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 border-t pt-3 mt-4">
          <button
            type="button"
            onClick={() => {
              setAiError(null);
              setAiOpen(true);
            }}
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 px-2 py-1 rounded hover:bg-violet-50"
          >
            <Sparkles size={14} />
            AI
          </button>
          <Link
            href={`/dashboard/jobs/edit/${id}`}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-indigo-600 px-2 py-1 rounded hover:bg-gray-100"
          >
            <Pencil size={14} />
            Edit
          </Link>
          <button
            onClick={async () => {
              const ok = confirm("Do you really want to delete this job?");
              if (!ok) return;
              const res = await fetch(`/api/jobs/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ softDelete: true }),
              });
              if (res.ok) {
                onDelete(id);
              } else {
                alert("Failed to delete job");
              }
            }}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 px-2 py-1 rounded hover:bg-gray-100"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* AI Assist Modal */}
      {aiOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setAiOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="AI assist"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md md:max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles size={20} className="text-violet-500" />
                AI Assist
              </h3>
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                className="p-1 rounded hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">{company}</span> · {title}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Stage: <span className="font-medium uppercase">{status}</span>
            </p>

            {jd?.trim() ? (
              <section className="mb-4">
                <h4 className="font-medium text-gray-800 mb-1">Saved job description</h4>
                <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap border border-gray-200">
                  {jd.trim()}
                </div>
              </section>
            ) : (
              <p className="text-xs text-gray-500 mb-4">
                No job description saved. Add one in Edit.
              </p>
            )}

            {aiError && (
              <p className="text-sm text-red-600 mb-2">{aiError}</p>
            )}

            <div className="space-y-4 text-sm">
              <section>
                <h4 className="font-medium text-gray-800 mb-1">Key skills extracted</h4>
                <p className="text-gray-500 text-xs mb-2">
                  AI will extract key skills from the job description to match your resume.
                </p>
                <button
                  type="button"
                  disabled={!jd?.trim() || aiLoading !== null}
                  onClick={() => handleAiGenerate("skills")}
                  className="text-xs px-3 py-1.5 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50"
                >
                  {aiLoading === "skills" ? "Generating…" : "Generate"}
                </button>
                {aiResult.skills && (
                  <div className="mt-2 text-xs text-gray-700 bg-gray-50 rounded p-2 max-h-32 overflow-y-auto whitespace-pre-wrap border border-gray-200">
                    {aiResult.skills}
                  </div>
                )}
              </section>
              <section>
                <h4 className="font-medium text-gray-800 mb-1">Interview prep questions</h4>
                <p className="text-gray-500 text-xs mb-2">
                  {status === "interview2" || status === "interview3"
                    ? "Technical focus: coding, live coding, and LeetCode-style questions based on the JD."
                    : "Get suggested questions and talking points for this role and company."}
                </p>
                <button
                  type="button"
                  disabled={!jd?.trim() || aiLoading !== null}
                  onClick={() => handleAiGenerate("interview")}
                  className="text-xs px-3 py-1.5 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50"
                >
                  {aiLoading === "interview" ? "Generating…" : "Generate"}
                </button>
                {aiResult.interview && (
                  <div className="mt-2 text-xs text-gray-700 bg-gray-50 rounded p-2 max-h-32 overflow-y-auto whitespace-pre-wrap border border-gray-200">
                    {aiResult.interview}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
