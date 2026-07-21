import { getAdminRankings } from "@/domains/admin/rankings";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { getCategoryLabel } from "@/lib/constants/categories";
import type { RankedUser } from "@/domains/admin/types";

export const dynamic = "force-dynamic";

function RankTable({
  users,
  valueKey,
  valueLabel,
  formatValue,
}: {
  users: RankedUser[];
  valueKey: keyof RankedUser;
  valueLabel: string;
  formatValue?: (u: RankedUser) => string;
}) {
  if (users.length === 0) return <AdminEmptyState message="No data yet." />;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            <th className="w-10 px-4 py-3">#</th>
            <th className="px-4 py-3">Name / Email</th>
            <th className="px-4 py-3">Track</th>
            <th className="px-4 py-3">Lv</th>
            <th className="px-4 py-3 text-right">{valueLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
          {users.map((user, i) => {
            const displayValue = formatValue
              ? formatValue(user)
              : String(user[valueKey] ?? "—");

            const medal =
              i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

            return (
              <tr key={user.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/60">
                <td className="px-4 py-3 text-gray-400 dark:text-gray-500">
                  {medal ?? <span className="text-xs">{i + 1}</span>}
                </td>
                <td className="px-4 py-3">
                  <p className="whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                    {user.name ?? <span className="italic text-gray-400 dark:text-gray-500">—</span>}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                  {getCategoryLabel(user.category)}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.currentLevel}</td>
                <td className="px-4 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-300">
                  {displayValue}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminRankingsPage() {
  const rankings = await getAdminRankings();

  return (
    <div className="space-y-10">
      <AdminHeader
        title="Rankings"
        subtitle="Active job seekers only — hired users excluded"
      />

      <section className="space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Top XP
        </h2>
        <RankTable
          users={rankings.topXp}
          valueKey="totalXp"
          valueLabel="XP"
          formatValue={(u) => u.totalXp.toLocaleString()}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Top Login Streak
        </h2>
        <RankTable
          users={rankings.topStreak}
          valueKey="loginStreak"
          valueLabel="Streak"
          formatValue={(u) => (u.loginStreak > 0 ? `${u.loginStreak}d` : "—")}
        />
      </section>
    </div>
  );
}
