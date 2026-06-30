// app/icon.png (static) takes precedence over this file in Next.js App Router.
// This file exists only as a fallback for environments where the static PNG
// is not picked up.
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#15121b",
          borderRadius: 7,
          fontSize: 18,
          fontWeight: 700,
          color: "#8b5cf6",
          fontFamily: "sans-serif",
        }}
      >
        C
      </div>
    ),
    size,
  );
}
