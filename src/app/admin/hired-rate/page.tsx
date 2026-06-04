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
        subtitle="HiredOffer 현황 — 상태별 통계, 급여·고용형태 분포, 전체 목록"
      />
      <HiredRateClient stats={stats} rows={rows} />
    </div>
  );
}
