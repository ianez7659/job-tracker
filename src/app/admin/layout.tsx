import { requireAdmin } from "@/domains/admin/require-admin";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin — Jobflow" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 pt-20 lg:p-8 lg:pt-8">{children}</main>
    </div>
  );
}
