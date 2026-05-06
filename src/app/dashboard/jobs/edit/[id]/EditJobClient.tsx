"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  inputBase,
  selectBase,
  labelBase,
  headingBase,
  buttonBase,
  helperText,
} from "@/lib/styles";
import { POSITION_LEVELS } from "@/lib/constants/positions";
import {
  getAdvanceButtonLabel,
  getNextStage,
  statusDisplayLabel,
} from "@/lib/jobPipeline";
import { MarkdownContent } from "@/components/MarkdownContent";
import { AiAssistCheeringCallout } from "@/components/AiAssistCheeringCallout";
import XpToast from "@/components/XpToast";
import { ClipboardPasteButton } from "@/components/ClipboardPasteButton";
import WalkInCompanyPrepPanel from "@/components/WalkInCompanyPrepPanel";
import { JobSource } from "@/generated/prisma";

type Job = {
  id: string;
  title: string;
  company: string;
  status: string;
  appliedAt: string;
  tags: string | null;
  url?: string | null;
  jd?: string | null;
  source?: JobSource | null;
};

type Props = {
  job: Job;
};

/** Pipeline stages where the right column shows interview prep (advice + questions). */
const INTERVIEW_PREP_STAGES = [
  "resume",
  "interview1",
  "interview2",
  "interview3",
] as const;

export default function EditJobClient({ job }: Props) {
  const router = useRouter();

  const isWalkIn =
    job.source === JobSource.WALK_IN ||
    (job.tags?.toLowerCase().includes("walk-in") ?? false);

  const [fetchJdError, setFetchJdError] = useState<string | null>(null);
  const [fetchJdLoading, setFetchJdLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [stage, setStage] = useState(job.status);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [form, setForm] = useState({
    title: job.title,
    company: job.company,
    tags: job.tags || "",
    url: job.url || "",
    jd: job.jd || "",
  });

  const [xpToast, setXpToast] = useState(0);

  const [adviceText, setAdviceText] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  const [questionsText, setQuestionsText] = useState<string | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const showInterviewPrep = (INTERVIEW_PREP_STAGES as readonly string[]).includes(
    stage,
  );

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    setQuestionsText(null);
    setQuestionsError(null);
  }, [stage]);

  useEffect(() => {
    if (!showInterviewPrep || isEditing || isWalkIn) {
      return;
    }
    const jd = form.jd?.trim();
    if (!jd) {
      setAdviceText(null);
      setAdviceError(null);
      setAdviceLoading(false);
      return;
    }

    let cancelled = false;
    setAdviceLoading(true);
    setAdviceError(null);

    fetch("/api/ai/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, action: "advice" }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { message?: string; text?: string };
        if (!res.ok) {
          throw new Error(data.message || "Could not load advice");
        }
        if (!cancelled) {
          setAdviceText(data.text ?? "");
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setAdviceError(e instanceof Error ? e.message : "Could not load advice");
          setAdviceText(null);
        }
      })
      .finally(() => {
        if (!cancelled) setAdviceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showInterviewPrep, isEditing, isWalkIn, job.id, stage, form.jd]);

  const handleLoadInterviewQuestions = async () => {
    if (!form.jd?.trim()) {
      setQuestionsError("Add a job description first.");
      return;
    }
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, action: "interview" }),
      });
      const data = (await res.json()) as { message?: string; text?: string };
      if (!res.ok) {
        throw new Error(data.message || "Could not generate questions");
      }
      setQuestionsText(data.text ?? "");
    } catch (e: unknown) {
      setQuestionsError(
        e instanceof Error ? e.message : "Could not generate questions",
      );
      setQuestionsText(null);
    } finally {
      setQuestionsLoading(false);
    }
  };

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
        status: stage,
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

  const patchStatusOnly = async (nextStatus: string) => {
    setPipelineLoading(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        xpGained?: number;
      };
      if (!res.ok) {
        alert(
          typeof data.message === "string"
            ? data.message
            : "Could not update stage",
        );
        return;
      }
      setStage(nextStatus);
      if ((data.xpGained ?? 0) > 0) {
        setXpToast(data.xpGained!);
      }
      router.refresh();
    } finally {
      setPipelineLoading(false);
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

        <div className="flex flex-col lg:flex-row lg:items-stretch min-h-[32rem]">
          {/* Left: view or edit form */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 border-r-0 lg:border-r border-gray-200 dark:border-slate-600">
            <div className="rounded-lg border border-indigo-200 dark:border-yellow-700/50 bg-indigo-50/50 dark:bg-slate-900/40 p-3 space-y-2 mb-6">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Pipeline
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Current stage:{" "}
                <strong className="text-gray-800 dark:text-gray-200">
                  {statusDisplayLabel(stage)}
                </strong>
              </p>
              {stage === "offer" || stage === "rejected" ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  This application is closed ({stage}).
                </p>
              ) : stage === "applying" ? (
                <Link
                  href={`/dashboard/jobs/apply/${job.id}`}
                  className="inline-flex text-sm font-medium text-indigo-600 dark:text-yellow-400 hover:underline"
                >
                  Continue on Apply page → submit application
                </Link>
              ) : (
                <div className="flex flex-col gap-2 max-w-lg">
                  {getNextStage(stage) && (
                    <button
                      type="button"
                      disabled={pipelineLoading}
                      onClick={() => patchStatusOnly(getNextStage(stage)!)}
                      className="w-full sm:w-auto text-center text-sm px-3 py-2.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-yellow-600 dark:hover:bg-yellow-500 dark:text-slate-900 disabled:opacity-50"
                    >
                      {getAdvanceButtonLabel(stage) ?? "Next stage"}
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={pipelineLoading}
                      onClick={() => patchStatusOnly("offer")}
                      className="text-sm px-3 py-2.5 rounded-md border-2 border-emerald-600 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 min-h-[44px]"
                    >
                      Mark as Offer
                    </button>
                    <button
                      type="button"
                      disabled={pipelineLoading}
                      onClick={() => {
                        if (
                          confirm(
                            "Mark this application as rejected / withdrawn?",
                          )
                        )
                          patchStatusOnly("rejected");
                      }}
                      className="text-sm px-3 py-2.5 rounded-md border-2 border-rose-600 bg-white text-rose-800 hover:bg-rose-100 dark:bg-slate-800 dark:border-rose-400 dark:text-rose-200 dark:hover:bg-rose-950/40 disabled:opacity-50 min-h-[44px]"
                    >
                      Mark as Rejected
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                    {isWalkIn ? "Job posting link" : "Job Posting URL"}
                  </p>
                  {isWalkIn && !form.url ? (
                    <p className="text-sm text-gray-400">Not used for walk-in / card entries</p>
                  ) : form.url ? (
                    <a
                      href={form.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 dark:text-yellow-400 underline break-all inline-block max-w-full max-h-[4.5em] overflow-y-auto leading-6 pr-1"
                    >
                      {form.url}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">Not provided</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {isWalkIn ? "Notes (card / conversation)" : "Job description"}
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
                    {isWalkIn ? "Job posting URL (optional — usually empty)" : "Job Posting URL (optional)"}
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={form.url}
                    onChange={handleChange}
                    placeholder={isWalkIn ? "Leave blank for card-only entries" : "https://example.com/job-posting"}
                    className={inputBase}
                    required={false}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {isWalkIn
                      ? "Walk-in entries typically do not have a posting URL."
                      : "You can add a link to the job posting if available."}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label htmlFor="jd" className={labelBase}>
                      {isWalkIn ? "Notes from card / conversation (optional)" : "Job description (optional)"}
                    </label>
                    {!isWalkIn && (
                      <button
                        type="button"
                        onClick={handleTryAutoFetch}
                        disabled={fetchJdLoading || !form.url?.trim()}
                        className="text-sm px-3 py-1.5 rounded border border-violet-500 text-violet-600 hover:bg-violet-50 dark:border-violet-400 dark:text-violet-300 dark:hover:bg-violet-900/30 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {fetchJdLoading ? "Fetching…" : "Try Auto-Fetch"}
                      </button>
                    )}
                    <ClipboardPasteButton
                      onText={(text) => {
                        setFetchJdError(null);
                        setForm((prev) => ({ ...prev, jd: text }));
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isWalkIn
                      ? "Paste or type what you captured from the card (name, email, etc.)."
                      : "Tip: Copy the JD on the posting page, then tap Paste."}
                  </p>
                  <textarea
                    id="jd"
                    name="jd"
                    value={form.jd}
                    onChange={handleChange}
                    placeholder={
                      isWalkIn
                        ? "Notes from the business card or your conversation…"
                        : "Paste the job description here (for AI features later)."
                    }
                    rows={6}
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

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Stage is updated from the Pipeline section above (not here).
                  Current: <strong>{statusDisplayLabel(stage)}</strong>
                </p>

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

          {/* Right: stage-based AI advice + interview questions (Applied onward) */}
          <div
            id="interview-prep"
            className="flex-1 min-w-0 min-h-[16rem] self-stretch p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-3 scroll-mt-20"
          >
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
              Interview prep
              {isWalkIn && (
                <span className="block normal-case text-xs font-normal text-amber-800 dark:text-amber-200/90 mt-1">
                  Walk-in / business card — pick the company below for angle ideas (session only, not saved).
                </span>
              )}
            </h2>

            {!showInterviewPrep ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stage === "applying"
                  ? "Stage advice and interview questions are available after you submit your application (Applied stage). Use the Apply page first."
                  : stage === "offer" || stage === "rejected"
                    ? "This application is closed — interview prep is no longer shown."
                    : "Interview prep is available from the Applied stage onward."}
              </p>
            ) : isWalkIn ? (
              <>
                <WalkInCompanyPrepPanel companyName={form.company} jd={form.jd || null} />
                {!form.jd?.trim() && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Tip: Add notes on the left (email, URL from the card) so company matching is more accurate.
                  </p>
                )}
              </>
            ) : !form.jd?.trim() ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Add a job description on the left (Edit) to enable AI advice and expected questions.
              </p>
            ) : (
              <>
                <div className="rounded-lg border border-indigo-200/80 dark:border-slate-600 bg-white/90 dark:bg-slate-800/90 p-3 shadow-sm">
                  <h3 className="text-xs font-semibold text-indigo-800 dark:text-yellow-200 mb-2">
                    Stage advice for this role
                  </h3>
                  {adviceLoading && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
                      Generating advice…
                    </p>
                  )}
                  {adviceError && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {adviceError}
                    </p>
                  )}
                  {!adviceLoading && !adviceError && adviceText && (
                    <>
                      <div className="max-h-[min(40vh,320px)] overflow-y-auto pr-1">
                        <MarkdownContent>{adviceText}</MarkdownContent>
                      </div>
                      <AiAssistCheeringCallout stage={stage} />
                    </>
                  )}
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 p-3 space-y-2">
                  <button
                    type="button"
                    onClick={handleLoadInterviewQuestions}
                    disabled={questionsLoading || adviceLoading}
                    className="w-full text-sm font-medium rounded-md bg-indigo-600 text-white px-3 py-2 hover:bg-indigo-700 disabled:opacity-50 dark:bg-yellow-600 dark:hover:bg-yellow-500 dark:text-slate-900"
                  >
                    {questionsLoading
                      ? "Generating…"
                      : "Show expected interview questions"}
                  </button>
                  {questionsError && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {questionsError}
                    </p>
                  )}
                  {questionsText && (
                    <div className="max-h-[min(40vh,360px)] overflow-y-auto border-t border-gray-100 dark:border-slate-600 pt-2 mt-1">
                      <MarkdownContent>{questionsText}</MarkdownContent>
                    </div>
                  )}
                </div>

                <p className={helperText}>
                  AI uses your saved job description and current stage. Edit JD on the left, then save —
                  refresh the page to see updated advice.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <XpToast xp={xpToast} onDismiss={() => setXpToast(0)} />
    </section>
  );
}
