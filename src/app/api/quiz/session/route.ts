import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateTodayQuizSession } from "@/lib/quiz/sessionService";

/**
 * GET /api/quiz/session?timeZone=America/Vancouver
 * Returns the user's quiz session for today (creates one if needed).
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const timeZone = url.searchParams.get("timeZone") ?? "UTC";

  const result = await getOrCreateTodayQuizSession(user.id, timeZone);

  if (!result.ok) {
    const status =
      result.error === "CATEGORY_NOT_SET" || result.error === "UNSUPPORTED_CATEGORY"
        ? 400
        : 422;
    return NextResponse.json({ error: result.error, message: result.message }, { status });
  }

  return NextResponse.json(result.value);
}
