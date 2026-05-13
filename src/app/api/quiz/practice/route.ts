import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPracticeQuestions } from "@/lib/quiz/practiceService";

export async function GET() {
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

  const questions = await getPracticeQuestions(user.id);
  if (questions.length === 0) {
    return NextResponse.json(
      { message: "No questions available. Please set your category first." },
      { status: 422 },
    );
  }

  return NextResponse.json({ questions });
}
