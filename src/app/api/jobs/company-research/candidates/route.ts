import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildCandidates } from "@/lib/companyResearch/buildCandidates";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      companyName?: string;
      jd?: string | null;
      emails?: string[];
      companyWebsite?: string | null;
    };

    const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
    if (!companyName) {
      return NextResponse.json({ message: "companyName is required" }, { status: 400 });
    }

    const result = buildCandidates({
      companyName,
      jd: body.jd ?? null,
      emails: Array.isArray(body.emails) ? body.emails : undefined,
      companyWebsite: body.companyWebsite ?? null,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("company-research/candidates:", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
