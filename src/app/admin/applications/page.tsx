import { Suspense } from "react";
import { getApplicationsPageForAdmin } from "@/domains/admin/applications";
import type { ApplicationsPageParams } from "@/domains/admin/applications";
import AdminHeader from "@/components/admin/AdminHeader";
import ApplicationsClient from "./ApplicationsClient";
import AdminApplicationsLoading from "./loading";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminApplicationsPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const params: ApplicationsPageParams = {
    q: str(sp.q) || undefined,
    status: str(sp.status) || undefined,
    track: str(sp.track) || undefined,
    sort: (str(sp.sort) as ApplicationsPageParams["sort"]) || undefined,
    dir: (str(sp.dir) as ApplicationsPageParams["dir"]) || undefined,
    page: Math.max(1, Number(str(sp.page) ?? "1")),
    perPage: PER_PAGE,
  };

  const { applications, total } = await getApplicationsPageForAdmin(params);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Application Monitor"
        subtitle="Monitor job applications across users, statuses, and progress signals."
      />
      <Suspense fallback={<AdminApplicationsLoading />}>
        <ApplicationsClient
          applications={applications}
          total={total}
          perPage={PER_PAGE}
        />
      </Suspense>
    </div>
  );
}
