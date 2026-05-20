import { getDetailedUsersForAdmin } from "@/domains/admin/users";
import { getAdminSession } from "@/domains/admin/require-admin";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { getCategoryLabel } from "@/lib/constants/categories";
import UserRoleDropdown from "./UserRoleDropdown";
import type { EmploymentStatus } from "@/domains/admin/types";

export const dynamic = "force-dynamic";

const EMPLOYMENT_BADGE: Record<
  EmploymentStatus,
  { label: string; className: string }
> = {
  hired: { label: "Hired", className: "bg-emerald-900/40 text-emerald-300 ring-emerald-700/50" },
  active: { label: "Active", className: "bg-blue-900/40 text-blue-300 ring-blue-700/50" },
  inactive: { label: "Inactive", className: "bg-gray-800 text-gray-400 ring-gray-700" },
};

function EmploymentBadge({ status }: { status: EmploymentStatus }) {
  const { label, className } = EMPLOYMENT_BADGE[status];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
      {label}
    </span>
  );
}

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

      {users.length === 0 ? (
        <AdminEmptyState message="No users found." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Name / Email</th>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Apply</th>
                <th className="px-4 py-3 text-center">Wait</th>
                <th className="px-4 py-3 text-center">Interview</th>
                <th className="px-4 py-3 text-center">Rejected</th>
                <th className="px-4 py-3 text-center">Offered</th>
                <th className="px-4 py-3 text-center">XP</th>
                <th className="px-4 py-3 text-center">Lv</th>
                <th className="px-4 py-3 text-center">Streak</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3">Hub Role</th>
                <th className="px-4 py-3">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-950">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-900/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-100 whitespace-nowrap">
                      {user.name ?? <span className="italic text-gray-500">—</span>}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {getCategoryLabel(user.category)}
                  </td>
                  <td className="px-4 py-3">
                    <EmploymentBadge status={user.employmentStatus} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">{user.jobCounts.total}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{user.jobCounts.applying}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{user.jobCounts.waiting}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{user.jobCounts.interview}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{user.jobCounts.rejected}</td>
                  <td className="px-4 py-3 text-center">
                    {user.jobCounts.offered > 0 ? (
                      <span className="font-semibold text-emerald-400">{user.jobCounts.offered}</span>
                    ) : (
                      <span className="text-gray-600">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">{user.totalXp.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-gray-300">{user.currentLevel}</td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {user.loginStreak > 0 ? `${user.loginStreak}d` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {user.lastActiveAt
                      ? user.lastActiveAt.toLocaleDateString("en-CA")
                      : "—"}
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
      )}
    </div>
  );
}
