import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const buffer = readFileSync(path.join(process.cwd(), "public/cluster-logo.webp"));
  const src = `data:image/webp;base64,${buffer.toString("base64")}`;

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
        }}
      >
        {/* logo is black — invert makes it white on the dark bg */}
        <img src={src} width={26} style={{ filter: "invert(1)", objectFit: "contain" }} />
      </div>
    ),
    size,
  );
}
