import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>
      <ProfileClient session={session} />
    </main>
  );
}
