import { ImageResponse } from "next/og";

function resolveOrigin(explicit?: string): string {
  const trimmed = explicit?.replace(/\/$/, "");
  if (trimmed) return trimmed;

  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return fromEnv || "http://localhost:3000";
}

/**
 * `ImageResponse` (@vercel/og) requires absolute URLs for `<img src>`.
 */
export function appIconImageResponse(size: number, origin?: string): ImageResponse {
  const src = `${resolveOrigin(origin)}/icons/jobflow-icon.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
        }}
      >
        <img
          src={src}
          alt="Jobflow icon"
          width={size}
          height={size}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    ),
    { width: size, height: size },
  );
}