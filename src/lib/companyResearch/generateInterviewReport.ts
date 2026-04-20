import OpenAI from "openai";
import type { CompanyCandidate, CompanyInterviewReportResponse } from "./types";

const REPORT_TIMEOUT_MS = 45_000;

const SYSTEM = `You help job seekers prepare for interviews. You must respond with a single JSON object only (no markdown).
Rules:
- "emphasisPoints": array of objects each with "text" (string) and "basis": either "page_excerpt" or "general".
- Use "page_excerpt" ONLY when the point is directly supported by the provided excerpt. If an excerpt is provided but a point is only loosely related, use "general" instead.
- If NO excerpt is provided, every point MUST use basis "general" and you must state realistic, non-specific interview advice (no fake facts about the company).
- "topicsToVerify": short strings the candidate should confirm on the company site or in conversation (not invented facts).
- "disclaimers": include at least one note that this is not official company information.
- Write in the language specified by the user message (ko or en).
- Do not invent revenue, employee counts, awards, or leadership names unless they appear in the excerpt.`;

export async function generateInterviewReport(params: {
  openai: OpenAI;
  candidate: CompanyCandidate;
  pageExcerpt: string | null;
  locale: "ko" | "en";
}): Promise<CompanyInterviewReportResponse> {
  const { candidate, pageExcerpt, locale } = params;
  const lang = locale === "ko" ? "Korean" : "English";

  const user = [
    `Language for all user-facing strings: ${lang}.`,
    `Company display name: ${candidate.displayName}`,
    `Primary domain: ${candidate.primaryDomain ?? "unknown"}`,
    `Canonical URL (if any): ${candidate.canonicalUrl ?? "none"}`,
    pageExcerpt && pageExcerpt.length > 0
      ? `Public page excerpt (may be incomplete):\n---\n${pageExcerpt.slice(0, 10_000)}\n---`
      : "No page excerpt is available. Use only general interview advice.",
    `Produce 4–7 emphasis points focused on how the candidate can present themselves in an interview for this employer (strengths to highlight, alignment with likely expectations).`,
  ].join("\n\n");

  const completion = await Promise.race([
    params.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1_200,
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Interview report timed out")), REPORT_TIMEOUT_MS);
    }),
  ]);

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid report JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid report shape");
  }
  const o = parsed as Record<string, unknown>;
  const emphasisRaw = o.emphasisPoints;
  const topicsRaw = o.topicsToVerify;
  const disclaimersRaw = o.disclaimers;

  const emphasisPoints: CompanyInterviewReportResponse["emphasisPoints"] = [];
  if (Array.isArray(emphasisRaw)) {
    for (const item of emphasisRaw) {
      if (!item || typeof item !== "object") continue;
      const e = item as Record<string, unknown>;
      const text = typeof e.text === "string" ? e.text.trim() : "";
      const basis = e.basis === "page_excerpt" ? "page_excerpt" : "general";
      if (text.length > 0) emphasisPoints.push({ text, basis });
    }
  }

  const topicsToVerify: string[] = Array.isArray(topicsRaw)
    ? topicsRaw.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    : [];

  const disclaimers: string[] = Array.isArray(disclaimersRaw)
    ? disclaimersRaw.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    : [];

  if (!pageExcerpt) {
    disclaimers.push(
      locale === "ko"
        ? "회사 웹페이지를 가져오지 못해 일반적인 면접 준비 팁입니다. 공식 사이트로 사실을 확인하세요."
        : "No company page could be fetched; tips are general. Verify facts on the official site.",
    );
  }

  return {
    entity: {
      displayName: candidate.displayName,
      primaryDomain: candidate.primaryDomain,
      canonicalUrl: candidate.canonicalUrl,
    },
    emphasisPoints,
    topicsToVerify,
    disclaimers,
    groundingExcerptUsed: Boolean(pageExcerpt && pageExcerpt.length > 80),
  };
}
