import { getAllApplicationsForAdmin } from "@/domains/admin/applications";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { getCategoryLabel } from "@/lib/constants/categories";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  applying:   "bg-blue-900/40 text-blue-300 ring-blue-700/50",
  resume:     "bg-indigo-900/40 text-indigo-300 ring-indigo-700/50",
  interview1: "bg-yellow-900/40 text-yellow-300 ring-yellow-700/50",
  interview2: "bg-orange-900/40 text-orange-300 ring-orange-700/50",
  interview3: "bg-amber-900/40 text-amber-300 ring-amber-700/50",
  offer:      "bg-emerald-900/40 text-emerald-300 ring-emerald-700/50",
  rejected:   "bg-red-900/40 text-red-300 ring-red-700/50",
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
  const className = STATUS_STYLES[status] ?? "bg-gray-800 text-gray-400 ring-gray-700";
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
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
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
            <tbody className="divide-y divide-gray-800 bg-gray-950">
              {applications.map((app) => (
                <tr key={app.jobId} className="hover:bg-gray-900/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-100 whitespace-nowrap">
                      {app.userName ?? <span className="italic text-gray-500">—</span>}
                    </p>
                    <p className="text-xs text-gray-500">{app.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-100 whitespace-nowrap">{app.company}</p>
                    <p className="text-xs text-gray-500 whitespace-nowrap">{app.title}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {getCategoryLabel(app.userCategory)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {app.appliedAt.toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {app.hasUrl ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-gray-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {app.hasJd ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-gray-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {app.hasNotes ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-gray-700">—</span>
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
