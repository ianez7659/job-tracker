import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Parses the SUPER_ADMIN_EMAILS environment variable.
 * Accepts a comma-separated list so multiple super admins can be designated.
 * Example: SUPER_ADMIN_EMAILS=admin@admin.com,ian@company.com
 */
function getSuperAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

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
 * Includes isSuperAdmin flag derived from SUPER_ADMIN_EMAILS env var.
 * Caller is responsible for returning 401/403.
 */
export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if (session.user.hubStatus !== "STAFF") return null;
  const isSuperAdmin = getSuperAdminEmails().includes(session.user.email ?? "");
  return { ...session, isSuperAdmin };
}
