import { notFound } from "next/navigation";
import { getHiredProfileDetail } from "@/domains/admin/hiredPool";
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

  return <HiredProfileClient profile={profile} />;
}
