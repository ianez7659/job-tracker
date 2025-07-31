import { prisma } from "@/lib/prisma";
import UsersClient from "./UserClient";
import { Search } from "lucide-react";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Search size={25} />
        Explore Users
      </h1>
      <UsersClient users={users} />
    </main>
  );
}
