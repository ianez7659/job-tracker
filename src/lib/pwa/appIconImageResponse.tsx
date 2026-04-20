import { ImageResponse } from "next/og";

export function appIconImageResponse(size: number): ImageResponse {
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
          src="/icons/jobflow-icon.png"
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