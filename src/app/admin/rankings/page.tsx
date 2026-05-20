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
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3 w-10">#</th>
            <th className="px-4 py-3">Name / Email</th>
            <th className="px-4 py-3">Track</th>
            <th className="px-4 py-3">Lv</th>
            <th className="px-4 py-3 text-right">{valueLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 bg-gray-950">
          {users.map((user, i) => {
            const displayValue = formatValue
              ? formatValue(user)
              : String(user[valueKey] ?? "—");

            const medal =
              i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

            return (
              <tr key={user.id} className="hover:bg-gray-900/60 transition-colors">
                <td className="px-4 py-3 text-gray-500">
                  {medal ?? <span className="text-xs">{i + 1}</span>}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-100 whitespace-nowrap">
                    {user.name ?? <span className="italic text-gray-500">—</span>}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                  {getCategoryLabel(user.category)}
                </td>
                <td className="px-4 py-3 text-gray-400">{user.currentLevel}</td>
                <td className="px-4 py-3 text-right font-semibold text-indigo-300">
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
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
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
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
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
