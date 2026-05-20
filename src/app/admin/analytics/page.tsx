import { getAdminAnalytics } from "@/domains/admin/analytics";
import AdminHeader from "@/components/admin/AdminHeader";
import AnalyticsCharts from "./AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalytics();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Analytics"
        subtitle="Job search flow insights — no Offer vs Rejected ratio"
      />
      <AnalyticsCharts analytics={analytics} />
    </div>
  );
}
