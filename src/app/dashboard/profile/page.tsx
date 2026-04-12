import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = session.user?.id;
  if (!userId) {
    redirect("/login");
  }

  const userRow = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      category: true,
      hubStatus: true,
      headline: true,
    },
  });

  return (
    <ProfileClient
      session={session}
      initialProfile={{
        name: userRow?.name ?? null,
        category: userRow?.category ?? null,
        hubStatus: userRow?.hubStatus ?? null,
        headline: userRow?.headline ?? null,
      }}
    />
  );
}
