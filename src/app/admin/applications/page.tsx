import { getAllApplicationsForAdmin } from "@/domains/admin/applications";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { getCategoryLabel } from "@/lib/constants/categories";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  applying:   "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-700/50",
  resume:     "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-indigo-700/50",
  interview1: "bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/40 dark:text-yellow-300 dark:ring-yellow-700/50",
  interview2: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/40 dark:text-orange-300 dark:ring-orange-700/50",
  interview3: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700/50",
  offer:      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700/50",
  rejected:   "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-700/50",
};

const STATUS_LABELS: Record<string, string> = {
  applying: "Applying",
  resume: "Waiting",
  interview1: "Interview 1",
  interview2: "Interview 2",
  interview3: "Interview 3",
  offer: "Offered",
  rejected: "Rejected",
};

function StatusBadge({ status }: { status: string }) {
  const className =
    STATUS_STYLES[status] ??
    "bg-gray-100 text-gray-500 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
      {label}
    </span>
  );
}

export default async function AdminApplicationsPage() {
  const applications = await getAllApplicationsForAdmin();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Applications"
        subtitle={`${applications.length} total job card${applications.length !== 1 ? "s" : ""}`}
      />

      {applications.length === 0 ? (
        <AdminEmptyState message="No applications found." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Company / Title</th>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3 text-center">URL</th>
                <th className="px-4 py-3 text-center">JD</th>
                <th className="px-4 py-3 text-center">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
              {applications.map((app) => (
                <tr key={app.jobId} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/60">
                  <td className="px-4 py-3">
                    <p className="whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                      {app.userName ?? <span className="italic text-gray-400 dark:text-gray-500">—</span>}
                    </p>
                    <p className="text-xs text-gray-500">{app.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{app.company}</p>
                    <p className="whitespace-nowrap text-xs text-gray-500">{app.title}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                    {getCategoryLabel(app.userCategory)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                    {app.appliedAt.toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {app.hasUrl ? (
                      <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {app.hasJd ? (
                      <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {app.hasNotes ? (
                      <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-700">—</span>
                    )}
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
