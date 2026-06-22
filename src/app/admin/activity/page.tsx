import AdminHeader from "@/components/admin/AdminHeader";
import ActivityClient from "./ActivityClient";

export const dynamic = "force-dynamic";

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Activity Log"
        subtitle="Track all admin actions"
      />
      <ActivityClient />
    </div>
  );
}
