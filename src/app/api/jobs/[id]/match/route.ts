import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Ensure Node runtime for any Node-only dependencies in future.
export const runtime = "nodejs";
const ATS_SNAPSHOT_KEEP_PER_JOB = 5;
const PDF_WORKER_TIMEOUT_MS = 20_000;
const OPENAI_TIMEOUT_MS = 25_000;
const PDF_PARSE_RETRIES = 3;
const PDF_PARSE_RETRY_DELAY_MS = 600;

const LOCAL_RESUME_PREFIX = "/uploads/resumes/";
const BLOB_HOST_PATTERN = /blob\.vercel-storage\.com$/i;

function isTrustedClientResumeUrl(url: string, jobId: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (t.startsWith(LOCAL_RESUME_PREFIX)) {
    return t.includes(jobId) && !t.includes("..");
  }
  try {
    const u = new URL(t);
    if (u.protocol !== "https:") return false;
    if (!BLOB_HOST_PATTERN.test(u.hostname)) return false;
    return u.pathname.includes(jobId);
  } catch {
    return false;
  }
}

/** DB value wins; optional body helps right after upload when reads can lag (e.g. pooled replica). */
function resolveResumeUrlForMatch(
  dbResume: string | null | undefined,
  bodyResume: unknown,
  jobId: string,
): string | null {
  const fromDb = typeof dbResume === "string" ? dbResume.trim() : "";
  if (fromDb) return fromDb;
  const fromBody = typeof bodyResume === "string" ? bodyResume.trim() : "";
  if (fromBody && isTrustedClientResumeUrl(fromBody, jobId)) return fromBody;
  return null;
}

type MatchResult = {
  score: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
};

/** Snapshot payload v1 — extend with subscores/actions without breaking old rows. */
type AtsMatchSnapshotPayloadV1 = {
  schemaVersion: 1;
  result: MatchResult;
  meta: {
    resumeFile: string | null;
    jdLength: number;
    model: string;
  };
};

function scoreFromSnapshotPayload(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as { schemaVersion?: number; result?: { score?: unknown } };
  const s = p.result?.score;
  return typeof s === "number" && Number.isFinite(s) ? s : null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: "OpenAI API key not configured" },
        { status: 503 }
      );
    }

    const { id: jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ message: "Job ID required" }, { status: 400 });
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        user: { email: session.user.email },
      },
      select: {
        jd: true,
        resumeFile: true,
        title: true,
        company: true,
      },
    });

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    let bodyJson: unknown;
    try {
      bodyJson = await req.json();
    } catch {
      bodyJson = {};
    }
    const bodyResume =
      bodyJson &&
      typeof bodyJson === "object" &&
      "resumeFile" in bodyJson
        ? (bodyJson as { resumeFile?: unknown }).resumeFile
        : undefined;

    const resumeUrl = resolveResumeUrlForMatch(job.resumeFile, bodyResume, jobId);

    const jdText = job.jd?.trim();
    if (!jdText) {
      return NextResponse.json(
        { message: "No job description saved for this job. Add one in Apply/Edit." },
        { status: 400 }
      );
    }

    if (!resumeUrl) {
      return NextResponse.json(
        {
          message:
            "No resume attached for this job. Upload a resume, wait for the upload to finish, then try again.",
        },
        { status: 400 }
      );
    }

    let resumeText = "";
    try {
      const pdfWorkerUrl = process.env.PDF_WORKER_URL;
      if (!pdfWorkerUrl) {
        return NextResponse.json(
          { message: "PDF worker service not configured (PDF_WORKER_URL)" },
          { status: 503 }
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (process.env.PDF_WORKER_API_KEY) {
        headers["x-api-key"] = process.env.PDF_WORKER_API_KEY;
      }

      const baseWorker = pdfWorkerUrl.replace(/\/+$/, "");
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < PDF_PARSE_RETRIES; attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, PDF_PARSE_RETRY_DELAY_MS));
        }
        const parseController = new AbortController();
        const parseTimeout = setTimeout(
          () => parseController.abort("PDF worker timeout"),
          PDF_WORKER_TIMEOUT_MS,
        );
        let parseRes: Response;
        try {
          parseRes = await fetch(`${baseWorker}/parse-pdf`, {
            method: "POST",
            headers,
            body: JSON.stringify({ url: resumeUrl }),
            signal: parseController.signal,
          });
        } finally {
          clearTimeout(parseTimeout);
        }

        const parseRaw = await parseRes.text();
        let parseData: {
          text?: unknown;
          extractedChars?: unknown;
          pageCount?: unknown;
          code?: unknown;
          message?: unknown;
        };
        try {
          parseData = parseRaw ? JSON.parse(parseRaw) : {};
        } catch {
          parseData = {};
        }
        if (!parseRes.ok) {
          lastError = new Error(
            typeof parseData.message === "string"
              ? parseData.message
              : `PDF parse failed with status ${parseRes.status}`,
          );
          if (parseRes.status >= 500) continue;
          throw lastError;
        }

        resumeText =
          typeof parseData.text === "string" ? parseData.text : "";

        if (resumeText.trim()) {
          lastError = null;
          break;
        }
        lastError = new Error("Empty text extracted from PDF.");
      }

      if (!resumeText.trim() && lastError) {
        throw lastError;
      }
    } catch (e) {
      console.error("Failed to extract resume text:", e);
      return NextResponse.json(
        {
          message:
            "Could not extract resume text. If you just uploaded a resume, try re-uploading it or check the PDF worker service logs.",
        },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt =
      "You are a precise career coach. Given a job description and a resume text, " +
      "you will extract skills from both and compute how well the resume matches the job. " +
      "Return ONLY valid JSON with this TypeScript type: " +
      "{ score: number; summary: string; matchedSkills: string[]; missingSkills: string[] }. " +
      "score is from 0 to 100 (integer). summary is a short 1-2 sentence explanation. " +
      "matchedSkills are key skills clearly present in both, missingSkills are important skills in the JD that are weak or absent in the resume. " +
      "Do not include any extra keys or commentary.";

    const userPrompt = [
      `Job title: ${job.title ?? ""}`,
      `Company: ${job.company ?? ""}`,
      "",
      "JOB DESCRIPTION:",
      jdText,
      "",
      "RESUME TEXT:",
      resumeText.slice(0, 20000), // safety limit
    ].join("\n");

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.2,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("OpenAI request timed out")), OPENAI_TIMEOUT_MS),
      ),
    ]);

    const raw =
      completion.choices[0]?.message?.content?.trim() ||
      '{"score":0,"summary":"No response","matchedSkills":[],"missingSkills":[]}';

    let parsed: MatchResult;
    try {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      const json = start !== -1 && end !== -1 ? raw.slice(start, end + 1) : raw;
      parsed = JSON.parse(json) as MatchResult;
    } catch (e) {
      console.error("Failed to parse AI match JSON:", e, raw);
      return NextResponse.json(
        {
          message:
            "AI returned an unexpected format. Please try again later.",
        },
        { status: 500 }
      );
    }

    const previous = await prisma.atsMatchSnapshot.findFirst({
      where: { jobId },
      orderBy: { createdAt: "desc" },
      select: { id: true, payload: true, createdAt: true },
    });

    const snapshotPayload: AtsMatchSnapshotPayloadV1 = {
      schemaVersion: 1,
      result: parsed,
      meta: {
        resumeFile: resumeUrl,
        jdLength: jdText.length,
        model: "gpt-4o-mini",
      },
    };

    const created = await prisma.atsMatchSnapshot.create({
      data: {
        jobId,
        payload: snapshotPayload,
      },
      select: { id: true, createdAt: true },
    });

    // Keep only the most recent N snapshots per job to cap table growth.
    const staleSnapshots = await prisma.atsMatchSnapshot.findMany({
      where: { jobId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: ATS_SNAPSHOT_KEEP_PER_JOB,
      select: { id: true },
    });
    if (staleSnapshots.length > 0) {
      await prisma.atsMatchSnapshot.deleteMany({
        where: {
          id: { in: staleSnapshots.map((s) => s.id) },
        },
      });
    }

    const prevScore = previous ? scoreFromSnapshotPayload(previous.payload) : null;
    const scoreDelta =
      prevScore !== null ? parsed.score - prevScore : null;

    return NextResponse.json({
      ...parsed,
      snapshotId: created.id,
      snapshotCreatedAt: created.createdAt.toISOString(),
      previousSnapshotId: previous?.id ?? null,
      previousSnapshotCreatedAt: previous?.createdAt.toISOString() ?? null,
      scoreDelta:
        scoreDelta === null || !Number.isFinite(scoreDelta)
          ? null
          : scoreDelta,
    });
  } catch (err) {
    console.error("AI resume match error:", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Failed to compute match score",
      },
      { status: 500 }
    );
  }
}

