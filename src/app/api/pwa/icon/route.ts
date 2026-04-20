import { appIconImageResponse } from "@/lib/pwa/appIconImageResponse";

const ALLOWED_SIZES = [192, 512] as const;
type AllowedSize = (typeof ALLOWED_SIZES)[number];

function isAllowedSize(n: number): n is AllowedSize {
  return (ALLOWED_SIZES as readonly number[]).includes(n);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sizeParam = searchParams.get("size");
  const size = Number(sizeParam);

  if (!Number.isInteger(size) || !isAllowedSize(size)) {
    return new Response(`Invalid size. Allowed: ${ALLOWED_SIZES.join(", ")}`, {
      status: 400,
    });
  }

  const origin = new URL(req.url).origin;
  return appIconImageResponse(size, origin);
}
