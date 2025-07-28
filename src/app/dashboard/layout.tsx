import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import MobileNav from "@/components/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect to login if session is not available
  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <NavBar />
      <div className="pt-16 pb-16">{children}</div>
      <MobileNav />
    </>
  );
}
