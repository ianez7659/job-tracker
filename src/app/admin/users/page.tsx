import { Suspense } from "react";
import { getDetailedUsersForAdmin } from "@/domains/admin/users";
import { getAdminSession } from "@/domains/admin/require-admin";
import AdminHeader from "@/components/admin/AdminHeader";
import UsersClient from "./UsersClient";
import AdminUsersLoading from "./loading";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [session, users] = await Promise.all([
    getAdminSession(),
    getDetailedUsersForAdmin(),
  ]);

  const currentUserId = session?.user.id ?? null;
  const isSuperAdmin = session?.isSuperAdmin ?? false;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Users"
        subtitle={`${users.length} registered user${users.length !== 1 ? "s" : ""}`}
      />
      <Suspense fallback={<AdminUsersLoading />}>
        <UsersClient users={users} currentUserId={currentUserId} isSuperAdmin={isSuperAdmin} />
      </Suspense>
    </div>
  );
}
