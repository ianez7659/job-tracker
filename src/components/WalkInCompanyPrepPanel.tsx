"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type {
  CompanyCandidate,
  CompanyInterviewReportResponse,
  CompanyResearchCandidatesResponse,
} from "@/lib/companyResearch/types";
import { labelBase } from "@/lib/styles";

type Props = {
  companyName: string;
  jd: string | null;
};

type Step = "pick" | "report";

/**
 * Walk-in / business-card flow: company disambiguation + interview-angle report.
 * Not persisted; lives on the job edit page only (see docs/agent-context.md redundancy rules).
 */
export default function WalkInCompanyPrepPanel({ companyName, jd }: Props) {
  const [step, setStep] = useState<Step>("pick");
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidatesPayload, setCandidatesPayload] =
    useState<CompanyResearchCandidatesResponse | null>(null);
  const [report, setReport] = useState<CompanyInterviewReportResponse | null>(null);

  useEffect(() => {
    setStep("pick");
    setError(null);
    setReport(null);
    setCandidatesPayload(null);
    setCandidatesLoading(true);

    const run = async () => {
      try {
        const res = await fetch("/api/jobs/company-research/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            jd: jd ?? "",
          }),
        });
        const data = (await res.json()) as CompanyResearchCandidatesResponse & { message?: string };
        if (!res.ok) {
          setError(data.message || "Could not load candidates");
          return;
        }
        setCandidatesPayload(data);
      } catch {
        setError("Network error");
      } finally {
        setCandidatesLoading(false);
      }
    };

    void run();
  }, [companyName, jd]);

  const runReport = async (selected: CompanyCandidate) => {
    setReportLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/company-research/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedCandidate: selected,
          locale: "en",
        }),
      });
      const data = (await res.json()) as CompanyInterviewReportResponse & { message?: string };
      if (!res.ok) {
        setError(data.message || "Could not generate report");
        return;
      }
      setReport(data);
      setStep("report");
    } catch {
      setError("Network error");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div
      id="walk-in-company-prep"
      className="rounded-lg border border-amber-200/90 dark:border-yellow-800/60 bg-amber-50/40 dark:bg-yellow-950/20 p-3 space-y-3"
    >
      <h3 className="text-xs font-semibold text-amber-900 dark:text-yellow-200 flex items-center gap-2">
        <Sparkles className="shrink-0 text-amber-600 dark:text-yellow-400" size={16} />
        Company & interview angles (from card)
      </h3>
      <p className="text-xs text-amber-900/90 dark:text-yellow-100/80">
        Not saved. Pick the employer that matches your card, then get angle ideas. Verify on the
        official site.
      </p>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {candidatesLoading && step === "pick" && (
        <div className="flex items-center gap-2 text-xs text-amber-900/80 dark:text-yellow-100/80">
          <Loader2 className="animate-spin" size={16} />
          Loading candidates…
        </div>
      )}

      {step === "pick" && candidatesPayload && !candidatesLoading && (
        <div className="space-y-2">
          {candidatesPayload.disclaimers.map((d) => (
            <p
              key={d}
              className="text-[11px] text-amber-900/90 dark:text-yellow-100/80 bg-white/60 dark:bg-slate-900/40 rounded-md px-2 py-1.5"
            >
              {d}
            </p>
          ))}
          <p className={labelBase}>Which company is this?</p>
          <ul className="space-y-1.5">
            {candidatesPayload.candidates.map((c) => (
              <li key={c.candidateId}>
                <button
                  type="button"
                  onClick={() => void runReport(c)}
                  disabled={reportLoading}
                  className="w-full text-left rounded-lg border border-amber-200 dark:border-yellow-800/50 px-3 py-2 text-xs hover:bg-white/80 dark:hover:bg-slate-800/80 disabled:opacity-60 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {c.displayName}
                    {c.primaryDomain ? (
                      <span className="text-gray-500 dark:text-gray-400 font-normal">
                        {" "}
                        · {c.primaryDomain}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{c.snippet}</div>
                  <div className="text-[10px] mt-0.5 text-gray-400">Confidence: {c.confidence}</div>
                </button>
              </li>
            ))}
          </ul>
          {reportLoading && (
            <div className="flex items-center gap-2 text-xs text-amber-900/80 dark:text-yellow-100/80 pt-1">
              <Loader2 className="animate-spin" size={14} />
              Generating tips…
            </div>
          )}
        </div>
      )}

      {step === "report" && reportLoading && !report && (
        <div className="flex items-center gap-2 text-xs text-amber-900/80 dark:text-yellow-100/80">
          <Loader2 className="animate-spin" size={16} />
          Generating tips…
        </div>
      )}

      {step === "report" && report && !reportLoading && (
        <div className="space-y-3 text-xs text-gray-800 dark:text-gray-100">
          {report.disclaimers.map((d) => (
            <p
              key={d}
              className="text-[11px] text-amber-900/90 dark:text-yellow-100/80 bg-white/60 dark:bg-slate-900/40 rounded-md px-2 py-1.5"
            >
              {d}
            </p>
          ))}
          <div>
            <p className={labelBase}>What to emphasize</p>
            <ul className="list-disc pl-4 space-y-1 mt-1">
              {report.emphasisPoints.map((p, i) => (
                <li key={i}>
                  {p.text}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">
                    ({p.basis === "page_excerpt" ? "from page excerpt" : "general"})
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {report.topicsToVerify.length > 0 && (
            <div>
              <p className={labelBase}>Double-check before the interview</p>
              <ul className="list-disc pl-4 space-y-0.5 mt-1">
                {report.topicsToVerify.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setStep("pick");
              setReport(null);
            }}
            className="text-xs text-indigo-600 dark:text-yellow-400 hover:underline"
          >
            ← Back to company list
          </button>
        </div>
      )}
    </div>
  );
}
