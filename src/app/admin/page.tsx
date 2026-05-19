import { getAdminOverview } from "@/domains/admin/overview";
import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminHeader from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();

  const hiredPct = (overview.hiredRate * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <AdminHeader title="Overview" subtitle="Student job search activity at a glance" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminMetricCard
          title="Currently Active Users"
          value={overview.currentlyActiveUsers}
          description="Logged in within the last 3 days"
          hint={`out of ${overview.totalStudents} total students`}
        />

        <AdminMetricCard
          title="Hired Rate"
          value={`${hiredPct}%`}
          description={`${overview.hiredCount} student${overview.hiredCount !== 1 ? "s" : ""} received an offer`}
          hint="offer status job card"
          accent="green"
        />

        <AdminMetricCard
          title="Users by Target Track"
          value={overview.categoryDistribution[0]?.label ?? "—"}
          description="Largest enrolled track"
          hint={
            overview.categoryDistribution
              .slice(0, 3)
              .map((c) => `${c.label}: ${c.count}`)
              .join(" · ")
          }
        />

        <AdminMetricCard
          title="Users Who May Need Support"
          value={overview.needsSupportCount}
          description="No jobs added or 14+ days inactive"
          accent="yellow"
        />

        <AdminMetricCard
          title="Stuck Applications"
          value={overview.stuckApplicationsCount}
          description="Applying / Applied with no progress for 14+ days"
          accent="red"
        />

        <AdminMetricCard
          title="Total Students"
          value={overview.totalStudents}
          description="Registered non-staff users"
        />
      </div>
    </div>
  );
}
