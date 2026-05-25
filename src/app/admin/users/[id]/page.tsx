import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminUserDetail } from "@/domains/admin/users";
import { getAdminSession } from "@/domains/admin/require-admin";
import { getCategoryLabel } from "@/lib/constants/categories";
import UserRoleDropdown from "../UserRoleDropdown";
import type { EmploymentStatus } from "@/domains/admin/types";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  applying: "Applying",
  resume: "Waiting",
  interview1: "Interview 1",
  interview2: "Interview 2",
  interview3: "Interview 3",
  offer: "Offered",
  rejected: "Rejected",
};

const STATUS_STYLES: Record<string, string> = {
  applying:   "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-700/50",
  resume:     "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-indigo-700/50",
  interview1: "bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/40 dark:text-yellow-300 dark:ring-yellow-700/50",
  interview2: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/40 dark:text-orange-300 dark:ring-orange-700/50",
  interview3: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700/50",
  offer:      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700/50",
  rejected:   "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-700/50",
};

const EMPLOYMENT_STYLES: Record<EmploymentStatus, string> = {
  hired:    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700/50",
  active:   "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-700/50",
  inactive: "bg-gray-100 text-gray-500 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700",
};

const EMPLOYMENT_LABELS: Record<EmploymentStatus, string> = {
  hired: "Hired",
  active: "Active",
  inactive: "Inactive",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function CountCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 text-center ${highlight && value > 0 ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20" : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"}`}>
      <p className={`text-2xl font-bold ${highlight && value > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-gray-100"}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, session] = await Promise.all([
    getAdminUserDetail(id),
    getAdminSession(),
  ]);

  if (!user) notFound();

  const isSuperAdmin = session?.isSuperAdmin ?? false;

  const joinedDate = user.createdAt.toLocaleDateString("en-CA");
  const lastActive = user.lastActiveAt
    ? user.lastActiveAt.toLocaleDateString("en-CA")
    : "Never";

  const hasSignals =
    user.signals.noInterview ||
    user.signals.longStuck ||
    user.signals.lowActivity ||
    user.signals.missingJobInfo > 0;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
        </svg>
        Back to Users
      </Link>

      {/* Profile summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
              {(user.name ?? user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {user.name ?? <span className="italic text-gray-400">No name</span>}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${EMPLOYMENT_STYLES[user.employmentStatus]}`}>
            {EMPLOYMENT_LABELS[user.employmentStatus]}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 text-sm">
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Track</dt>
            <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">
              {user.category ? getCategoryLabel(user.category) : <span className="text-gray-400">Not set</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Hub Status</dt>
            <dd className="mt-0.5">
              {isSuperAdmin ? (
                <UserRoleDropdown
                  userId={user.id}
                  current={user.hubStatus}
                  isSelf={false}
                />
              ) : (
                <span className="font-medium text-gray-900 dark:text-gray-100">{user.hubStatus ?? "—"}</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Joined</dt>
            <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">{joinedDate}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Last Active</dt>
            <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">{lastActive}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">XP</dt>
            <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">{user.totalXp.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Level</dt>
            <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">{user.currentLevel}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Login Streak</dt>
            <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">{user.loginStreak} days</dd>
          </div>
        </dl>
      </div>

      {/* Job count cards */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <CountCard label="Total" value={user.jobCounts.total} />
        <CountCard label="Applying" value={user.jobCounts.applying} />
        <CountCard label="Waiting" value={user.jobCounts.waiting} />
        <CountCard label="Interview" value={user.jobCounts.interview} />
        <CountCard label="Rejected" value={user.jobCounts.rejected} />
        <CountCard label="Offered" value={user.jobCounts.offered} highlight />
      </div>

      {/* Support signals */}
      {hasSignals && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Operational Signals
          </p>
          <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
            {user.signals.noInterview && (
              <li>• {user.jobCounts.total}+ applications with no interview stage reached</li>
            )}
            {user.signals.longStuck && (
              <li>• One or more applications stuck in Applying / Waiting for 14+ days</li>
            )}
            {user.signals.lowActivity && (
              <li>• No activity recorded in the last 14 days</li>
            )}
            {user.signals.missingJobInfo > 0 && (
              <li>• {user.signals.missingJobInfo} job card{user.signals.missingJobInfo > 1 ? "s" : ""} missing URL or job description</li>
            )}
          </ul>
        </div>
      )}

      {/* Applications table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Applications <span className="ml-1 text-gray-400">({user.jobs.length})</span>
          </p>
        </div>
        {user.jobs.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400 dark:text-gray-500">No applications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {["Company", "Title", "Status", "Applied", "Updated", "URL", "JD", "Notes"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {user.jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{job.company}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{job.title}</td>
                    <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {job.appliedAt.toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {job.updatedAt.toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {job.hasUrl
                        ? <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {job.hasJd
                        ? <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {job.hasNotes
                        ? <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
