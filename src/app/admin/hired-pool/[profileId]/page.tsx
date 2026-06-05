import { notFound } from "next/navigation";
import { getHiredProfileDetail } from "@/domains/admin/hiredPool";
import AdminHeader from "@/components/admin/AdminHeader";
import HiredProfileClient from "./HiredProfileClient";

export const dynamic = "force-dynamic";

export default async function HiredProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const profile = await getHiredProfileDetail(profileId);

  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <AdminHeader
        title={profile.userName ?? profile.userEmail}
        subtitle={`${profile.userCategory ?? "—"} · ${profile.userEmail}`}
      />
      <HiredProfileClient profile={profile} />
    </div>
  );
}
