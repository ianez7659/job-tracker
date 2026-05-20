import { getAllUsersForAdmin } from "@/domains/admin/users";
import { getAdminSession } from "@/domains/admin/require-admin";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { getCategoryLabel } from "@/lib/constants/categories";
import UserRoleDropdown from "./UserRoleDropdown";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [session, users] = await Promise.all([
    getAdminSession(),
    getAllUsersForAdmin(),
  ]);

  const currentUserId = session?.user.id ?? null;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Users"
        subtitle={`${users.length} registered user${users.length !== 1 ? "s" : ""}`}
      />

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Name / Email</th>
              <th className="px-4 py-3">Track</th>
              <th className="px-4 py-3">Jobs</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Change Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-950">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-900/60 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-100">
                    {user.name ?? <span className="italic text-gray-500">—</span>}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {getCategoryLabel(user.category)}
                </td>
                <td className="px-4 py-3 text-gray-400">{user.jobCount}</td>
                <td className="px-4 py-3 text-gray-400">
                  {user.createdAt.toLocaleDateString("en-CA")}
                </td>
                <td className="px-4 py-3">
                  <AdminStatusBadge status={user.hubStatus} />
                </td>
                <td className="px-4 py-3">
                  <UserRoleDropdown
                    userId={user.id}
                    current={user.hubStatus}
                    isSelf={user.id === currentUserId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
