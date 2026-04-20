import { headers } from "next/headers";

/**
 * Builds an absolute origin for OG ImageResponse `<img src>` (requires absolute URLs).
 */
export async function getRequestOrigin(): Promise<string> {
  const headersList = await headers();
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  if (host) {
    return `${proto}://${host}`;
  }

  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return fromEnv || "http://localhost:3000";
}
