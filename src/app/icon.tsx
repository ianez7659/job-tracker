import { appIconImageResponse } from "@/lib/pwa/appIconImageResponse";
import { getRequestOrigin } from "@/lib/pwa/getRequestOrigin";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const origin = await getRequestOrigin();
  return appIconImageResponse(32, origin);
}
