import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CategoryPickerClient from "./CategoryPickerClient";

export default async function CategoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");


  return (
    <main className="p-6 max-w-md mx-auto">
      <CategoryPickerClient />
    </main>
  );
}
