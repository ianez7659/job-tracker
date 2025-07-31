import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <SettingsClient session={session} />
    </main>
  );
}
