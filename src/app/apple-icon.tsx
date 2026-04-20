import { appIconImageResponse } from "@/lib/pwa/appIconImageResponse";
import { getRequestOrigin } from "@/lib/pwa/getRequestOrigin";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const origin = await getRequestOrigin();
  return appIconImageResponse(180, origin);
}
