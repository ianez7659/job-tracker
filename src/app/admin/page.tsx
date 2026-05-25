import Link from "next/link";
import { getAdminOverview } from "@/domains/admin/overview";
import { getActiveJobSeekerRanking } from "@/domains/admin/users";
import AdminHeader from "@/components/admin/AdminHeader";
import TrackDistributionCard from "@/components/admin/TrackDistributionCard";
import { getCategoryLabel } from "@/lib/constants/categories";

export const dynamic = "force-dynamic";

// ── Shared sub-components ────────────────────────────────────────────────────

function CardIconBox({
  color,
  children,
}: {
  color: "indigo" | "amber" | "emerald";
  children: React.ReactNode;
}) {
  const cls = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
    amber:  "bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    emerald:"bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  }[color];
  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cls}`}>
      {children}
    </div>
  );
}

function BigStat({ count, total, label }: { count: number; total: number; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        {count}
        <span className="text-lg font-normal text-gray-400 dark:text-gray-500"> / {total}</span>
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function UserAvatar({ name, email }: { name: string | null; email: string }) {
  const initial = (name ?? email).charAt(0).toUpperCase();
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      {initial}
    </div>
  );
}

function ViewAllLink({ href, label = "View all →" }: { href: string; label?: string }) {
  return (
    <div className="mt-3 text-right">
      <Link
        href={href}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
      >
        {label}
      </Link>
    </div>
  );
}

// ── SVG gauge (no Recharts needed) ──────────────────────────────────────────

function CircleGauge({ rate }: { rate: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(rate, 1));
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" strokeWidth="8"
        className="stroke-gray-100 dark:stroke-gray-800" />
      <circle cx="36" cy="36" r={r} fill="none" strokeWidth="8"
        stroke="#10b981" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 36 36)" />
    </svg>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminOverviewPage() {
  const [overview, ranking] = await Promise.all([
    getAdminOverview(),
    getActiveJobSeekerRanking(5),
  ]);

  const activePct = overview.totalStudents > 0
    ? Math.round((overview.currentlyActiveUsers / overview.totalStudents) * 100)
    : 0;
  const hiredPct = (overview.hiredRate * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <AdminHeader title="Overview" subtitle="Student job search activity at a glance" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        {/* ── Card 1 — Currently Active Users ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <CardIconBox color="indigo">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </CardIconBox>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-gray-600 dark:text-gray-200">Currently Active Users</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Logged in within the last 3 days</p>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <BigStat count={overview.currentlyActiveUsers} total={overview.totalStudents} label="students" />
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activePct}%</p>
              <p className="text-xs text-gray-500">of total students</p>
            </div>
          </div>
          {overview.topActiveUsers.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">No active users in the last 3 days</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
              {overview.topActiveUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-2 py-2">
                  <UserAvatar name={u.name} email={u.email} />
                  <Link href={`/admin/users/${u.id}`} className="min-w-0 flex-1 truncate text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">
                    {u.name ?? u.email}
                  </Link>
                  <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    Active
                  </span>
                </li>
              ))}
            </ul>
          )}
          <ViewAllLink href="/admin/users" />
        </div>

        {/* ── Card 2 — Active Job Seeker Ranking ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <CardIconBox color="indigo">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
            </CardIconBox>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-gray-600 dark:text-gray-200">Active Job Seeker Ranking</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">XP leaders · hired excluded</p>
            </div>
          </div>
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
                      <span className="w-4 shrink-0 text-xs text-gray-400 dark:text-gray-500">{i + 1}</span>
                      <span className="w-20 shrink-0 truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                        {user.name ?? user.email}
                      </span>
                      <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        Lv.{user.currentLevel}
                      </span>
                      <div className="flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${barPct}%` }} />
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
          <ViewAllLink href="/admin/rankings" />
        </div>

        {/* ── Card 3 — Users by Target Track ── */}
        <TrackDistributionCard data={overview.categoryDistribution} />

        {/* ── Card 4 — Users Who May Need Support ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <CardIconBox color="amber">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
              </svg>
            </CardIconBox>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-gray-600 dark:text-gray-200">Users Who May Need Support</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">No jobs added or 14+ days inactive</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-6">
            <BigStat count={overview.needsSupportCount} total={overview.totalStudents} label="students" />
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Reasons</p>
              <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
                <li>• No activity for 14+ days</li>
                <li>• No jobs added</li>
              </ul>
            </div>
          </div>
          {overview.topSupportUsers.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">No users need support</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
              {overview.topSupportUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-2 py-2">
                  <UserAvatar name={u.name} email={u.email} />
                  <Link href={`/admin/users/${u.id}`} className="min-w-0 flex-1 truncate text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">
                    {u.name ?? u.email}
                  </Link>
                  <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                    {u.reason === "no_jobs" ? "No jobs yet" : "14+ days ago"}
                  </span>
                  <span className="shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    {u.reason === "no_jobs" ? "No Jobs" : "Low Activity"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <ViewAllLink href="/admin/users" />
        </div>

        {/* ── Card 5 — Stuck Applications ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <CardIconBox color="indigo">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
              </svg>
            </CardIconBox>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-gray-600 dark:text-gray-200">Stuck Applications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Applying / Applied with no progress for 14+ days</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-6">
            <BigStat count={overview.stuckUsersCount} total={overview.totalStudents} label="students" />
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Criteria</p>
              <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
                <li>• Applying / waiting 14+ days</li>
                <li>• No status update</li>
              </ul>
            </div>
          </div>
          {overview.topStuckUsers.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">No stuck applications</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
              {overview.topStuckUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-2 py-2">
                  <UserAvatar name={u.name} email={u.email} />
                  <Link href={`/admin/users/${u.id}`} className="min-w-0 flex-1 truncate text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">
                    {u.name ?? u.email}
                  </Link>
                  <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                    {u.applicationCount} stuck
                  </span>
                  <span className="shrink-0 rounded-md bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                    No Progress
                  </span>
                </li>
              ))}
            </ul>
          )}
          <ViewAllLink href="/admin/applications" />
        </div>

        {/* ── Card 6 — Hired Rate ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <CardIconBox color="emerald">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
              </svg>
            </CardIconBox>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-gray-600 dark:text-gray-200">Hired Rate</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">offer status job card</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            {/* Gauge + stat */}
            <div className="flex shrink-0 flex-col items-center gap-1">
              <CircleGauge rate={overview.hiredRate} />
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{hiredPct}%</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                {overview.hiredCount} / {overview.totalStudents}
              </p>
              <p className="text-xs text-gray-500">students</p>
            </div>
            {/* Hired user list */}
            {overview.topHiredUsers.length > 0 ? (
              <ul className="min-w-0 flex-1 divide-y divide-gray-100 dark:divide-gray-800">
                {overview.topHiredUsers.map((u) => (
                  <li key={u.id} className="flex items-center gap-2 py-2">
                    <UserAvatar name={u.name} email={u.email} />
                    <Link href={`/admin/users/${u.id}`} className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400">
                        {u.name ?? u.email}
                      </p>
                      <p className="truncate text-xs text-gray-500">{getCategoryLabel(u.category)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No hired students yet</p>
            )}
          </div>
          <ViewAllLink href="/admin/users" label="View all students" />
        </div>

      </div>
    </div>
  );
}
