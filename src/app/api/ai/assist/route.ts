import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AiAssistAction = "skills" | "interview";

const PROMPTS: Record<
  AiAssistAction,
  { system: string; userPrefix: string }
> = {
  skills: {
    system: `You are a career coach. Given a job description, extract and list the key skills and requirements (technical and soft) in a clear, concise list. Use bullet points. Write in the same language as the job description.`,
    userPrefix: "Job description:\n\n",
  },
  interview: {
    system: `You are a career coach. Given a job description, suggest 8-10 likely interview questions and brief talking-point tips for each. Format as a clear list with "Q:" and "Tips:" for each. Write in the same language as the job description.`,
    userPrefix: "Job description:\n\n",
  },
};

const INTERVIEW_TECH_SYSTEM = `You are a technical interview coach. Given a job description, suggest 8-10 technical interview questions that may appear in later rounds: focus on coding (algorithms, data structures), live coding scenarios, and LeetCode-style problems where relevant. For each question provide: the question, what they're assessing, and brief tips or approach. Base everything on the JD's tech stack and role. Format as a clear list with "Q:" and "What they assess / Tips:". Write in the same language as the job description.`;

export async function POST(req: Request) {
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

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const body = await req.json();
    const { jobId, action } = body as { jobId?: string; action?: AiAssistAction };

    if (!jobId || !action || !["skills", "interview"].includes(action)) {
      return NextResponse.json(
        { message: "Missing or invalid jobId or action" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        user: { email: session.user.email },
      },
      select: { id: true, title: true, company: true, status: true, jd: true },
    });

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const jdText = job.jd?.trim();
    if (!jdText) {
      return NextResponse.json(
        { message: "No job description saved for this job. Add one in Edit." },
        { status: 400 }
      );
    }

    const { system, userPrefix } = PROMPTS[action];
    let systemPrompt = system;
    if (action === "interview" && (job.status === "interview2" || job.status === "interview3")) {
      systemPrompt = INTERVIEW_TECH_SYSTEM;
    }
    const userContent = `${userPrefix}${jdText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: 1500,
    });

    const text =
      completion.choices[0]?.message?.content?.trim() ||
      "No response generated.";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("AI assist error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}
