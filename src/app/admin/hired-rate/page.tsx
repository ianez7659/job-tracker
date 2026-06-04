import { getHiredRateStats, getHiredOfferRows } from "@/domains/admin/hiredRate";
import AdminHeader from "@/components/admin/AdminHeader";
import HiredRateClient from "./HiredRateClient";

export const dynamic = "force-dynamic";

export default async function AdminHiredRatePage() {
  const [stats, rows] = await Promise.all([getHiredRateStats(), getHiredOfferRows()]);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Hired Rate"
        subtitle="Offer status overview — salary, employment type, and work arrangement breakdown"
      />
      <HiredRateClient stats={stats} rows={rows} />
    </div>
  );
}
