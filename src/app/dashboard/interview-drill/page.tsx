import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QuizClient from "./QuizClient";
import PracticeClient from "./PracticeClient";

type PageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function InterviewDrillPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true },
  });
  if (!user) {
    redirect("/login");
  }

  const sp = await searchParams;
  const isPractice = sp.mode === "practice";

  if (isPractice) {
    return <PracticeClient userName={user.name ?? null} />;
  }
  return <QuizClient userName={user.name ?? null} />;
}
