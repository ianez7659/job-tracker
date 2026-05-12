import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { answerQuizItem } from "@/lib/quiz/sessionService";

/**
 * POST /api/quiz/session/[sessionId]/answer
 * Body: { itemId: string; answerChoiceId: string }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
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

  const { sessionId } = await params;
  const body = await req.json();
  const { itemId, answerChoiceId } = body as {
    itemId?: string;
    answerChoiceId?: string;
  };

  if (!itemId || !answerChoiceId) {
    return NextResponse.json(
      { message: "itemId and answerChoiceId are required" },
      { status: 400 },
    );
  }

  // Verify the item belongs to the given sessionId (extra guard)
  const item = await prisma.dailyQuizSessionItem.findUnique({
    where: { id: itemId },
    select: { sessionId: true },
  });
  if (!item || item.sessionId !== sessionId) {
    return NextResponse.json(
      { message: "Item not found in this session" },
      { status: 404 },
    );
  }

  const result = await answerQuizItem(itemId, user.id, answerChoiceId);

  if (!result.ok) {
    const status =
      result.error === "ALREADY_ANSWERED"
        ? 409
        : result.error === "WRONG_USER"
          ? 403
          : result.error === "ITEM_NOT_FOUND"
            ? 404
            : 500;
    return NextResponse.json({ error: result.error, message: result.message }, { status });
  }

  return NextResponse.json(result.value);
}
