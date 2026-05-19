import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Server-side STAFF guard. Call at the top of any admin Server Component or API route.
 * Redirects to /login if unauthenticated, to /dashboard if not STAFF.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.hubStatus !== "STAFF") redirect("/dashboard");
  return session;
}

/**
 * API route variant — returns null instead of redirecting.
 * Caller is responsible for returning 401/403.
 */
export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if (session.user.hubStatus !== "STAFF") return null;
  return session;
}
