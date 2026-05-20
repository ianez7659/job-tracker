import { getAdminOverview } from "@/domains/admin/overview";
import { getActiveJobSeekerRanking } from "@/domains/admin/users";
import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminHeader from "@/components/admin/AdminHeader";
import TrackDistributionCard from "@/components/admin/TrackDistributionCard";
import { getCategoryLabel } from "@/lib/constants/categories";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [overview, ranking] = await Promise.all([
    getAdminOverview(),
    getActiveJobSeekerRanking(5),
  ]);

  const hiredPct = (overview.hiredRate * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <AdminHeader title="Overview" subtitle="Student job search activity at a glance" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Card 1 — Currently Active Users */}
        <AdminMetricCard
          title="Currently Active Users"
          value={overview.currentlyActiveUsers}
          description="Logged in within the last 3 days"
          hint={`out of ${overview.totalStudents} total students`}
        />

        {/* Card 2 — Active Job Seeker Ranking */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Active Job Seeker Ranking
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-600">XP leaders · hired excluded</p>
          {ranking.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">No data yet</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {ranking.map((user, i) => (
                <li key={user.id} className="flex items-center gap-2">
                  <span className="w-5 text-center text-xs font-bold text-gray-400 dark:text-gray-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.name ?? user.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getCategoryLabel(user.category)} · Lv {user.currentLevel} · {user.totalXp} XP
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Card 3 — Users by Target Track */}
        <TrackDistributionCard data={overview.categoryDistribution} />

        {/* Card 4 — Users Who May Need Support */}
        <AdminMetricCard
          title="Users Who May Need Support"
          value={overview.needsSupportCount}
          description="No jobs added or 14+ days inactive"
          accent="yellow"
        />

        {/* Card 5 — Stuck Applications */}
        <AdminMetricCard
          title="Stuck Applications"
          value={overview.stuckApplicationsCount}
          description="Applying / Applied with no progress for 14+ days"
          accent="red"
        />

        {/* Card 6 — Hired Rate */}
        <AdminMetricCard
          title="Hired Rate"
          value={`${hiredPct}%`}
          description={`${overview.hiredCount} / ${overview.totalStudents} students received an offer`}
          hint="offer status job card"
          accent="green"
        />
      </div>
    </div>
  );
}
