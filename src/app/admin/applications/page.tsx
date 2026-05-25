import { Suspense } from "react";
import { getAllApplicationsForAdmin } from "@/domains/admin/applications";
import AdminHeader from "@/components/admin/AdminHeader";
import ApplicationsClient from "./ApplicationsClient";
import AdminApplicationsLoading from "./loading";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  const applications = await getAllApplicationsForAdmin();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Application Monitor"
        subtitle="Monitor job applications across users, statuses, and progress signals."
      />
      <Suspense fallback={<AdminApplicationsLoading />}>
        <ApplicationsClient applications={applications} />
      </Suspense>
    </div>
  );
}
