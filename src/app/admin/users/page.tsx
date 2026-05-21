import { getDetailedUsersForAdmin } from "@/domains/admin/users";
import { getAdminSession } from "@/domains/admin/require-admin";
import AdminHeader from "@/components/admin/AdminHeader";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [session, users] = await Promise.all([
    getAdminSession(),
    getDetailedUsersForAdmin(),
  ]);

  const currentUserId = session?.user.id ?? null;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Users"
        subtitle={`${users.length} registered user${users.length !== 1 ? "s" : ""}`}
      />
      <UsersClient users={users} currentUserId={currentUserId} />
    </div>
  );
}
