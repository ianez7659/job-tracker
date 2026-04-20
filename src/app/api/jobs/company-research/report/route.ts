import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";
import type { CompanyCandidate } from "@/lib/companyResearch/types";
import { fetchPublicPageExcerpt } from "@/lib/companyResearch/fetchSiteExcerpt";
import { isSafePublicHttpUrl } from "@/lib/companyResearch/ssrf";
import { generateInterviewReport } from "@/lib/companyResearch/generateInterviewReport";

export const maxDuration = 60;

function isCandidate(x: unknown): x is CompanyCandidate {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.candidateId === "string" &&
    typeof o.displayName === "string" &&
    (o.primaryDomain === null || typeof o.primaryDomain === "string") &&
    (o.canonicalUrl === null || typeof o.canonicalUrl === "string") &&
    typeof o.snippet === "string" &&
    Array.isArray(o.sources) &&
    typeof o.confidence === "string"
  );
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: "OpenAI API key not configured" },
        { status: 503 },
      );
    }

    const body = (await req.json()) as {
      selectedCandidate?: unknown;
      locale?: "ko" | "en";
    };

    if (!isCandidate(body.selectedCandidate)) {
      return NextResponse.json(
        { message: "selectedCandidate is required and must match CompanyCandidate shape" },
        { status: 400 },
      );
    }

    const locale = body.locale === "ko" ? "ko" : "en";
    const candidate = body.selectedCandidate;

    let fetchUrl: string | null = candidate.canonicalUrl;
    if (!fetchUrl && candidate.primaryDomain) {
      fetchUrl = `https://${candidate.primaryDomain}`;
    }
    if (fetchUrl && !isSafePublicHttpUrl(fetchUrl)) {
      fetchUrl = null;
    }

    const pageExcerpt = fetchUrl ? await fetchPublicPageExcerpt(fetchUrl) : null;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const report = await generateInterviewReport({
      openai,
      candidate,
      pageExcerpt,
      locale,
    });

    return NextResponse.json(report);
  } catch (err) {
    console.error("company-research/report:", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
