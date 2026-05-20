import { getAdminOverview } from "@/domains/admin/overview";
import { getActiveJobSeekerRanking } from "@/domains/admin/users";
import Link from "next/link";
import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminHeader from "@/components/admin/AdminHeader";
import TrackDistributionCard from "@/components/admin/TrackDistributionCard";

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
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Active Job Seeker Ranking
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600">XP leaders · hired excluded</p>
            </div>
          </div>

          {/* List */}
          {ranking.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">No data yet</p>
          ) : (() => {
            const maxXp = ranking[0]?.totalXp ?? 1;
            return (
              <ol className="mt-4 space-y-3">
                {ranking.map((user, i) => {
                  const barPct = Math.round((user.totalXp / maxXp) * 100);
                  return (
                    <li key={user.id} className="flex items-center gap-2">
                      <span className="w-4 shrink-0 text-xs text-gray-400 dark:text-gray-500">
                        {i + 1}
                      </span>
                      <span className="w-20 shrink-0 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {user.name ?? user.email}
                      </span>
                      <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        Lv.{user.currentLevel}
                      </span>
                      <div className="flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-14 shrink-0 text-right text-xs text-gray-500 dark:text-gray-400">
                        {user.totalXp.toLocaleString()} XP
                      </span>
                    </li>
                  );
                })}
              </ol>
            );
          })()}

          {/* Footer link */}
          <div className="mt-4 text-right">
            <Link
              href="/admin/rankings"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View all students →
            </Link>
          </div>
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
