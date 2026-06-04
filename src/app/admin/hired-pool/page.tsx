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
        subtitle="Per-student CRM — verify or deactivate offers, manage admin notes"
      />
      <HiredPoolClient entries={entries} />
    </div>
  );
}
