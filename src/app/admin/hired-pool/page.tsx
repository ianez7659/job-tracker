import { getHiredPoolEntries } from "@/domains/admin/hiredPool";
import AdminHeader from "@/components/admin/AdminHeader";
import HiredPoolClient from "./HiredPoolClient";

export const dynamic = "force-dynamic";

export default async function AdminHiredPoolPage() {
  const entries = await getHiredPoolEntries();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Hired Pool"
        subtitle="학생별 HiredProfile CRM — offer verify, deactivate, notes 관리"
      />
      <HiredPoolClient entries={entries} />
    </div>
  );
}
