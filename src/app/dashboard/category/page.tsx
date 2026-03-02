import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CategoryPickerClient from "./CategoryPickerClient";

export default async function CategoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const category = (session.user as { category?: string | null }).category;
  if (category != null && category !== "") redirect("/dashboard");

  return (
    <main className="p-6 max-w-md mx-auto">
      <CategoryPickerClient />
    </main>
  );
}
