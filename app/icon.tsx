import { ImageResponse } from "next/og";
import { orbSvg } from "@/lib/orbSvg";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#050506", borderRadius: 14 }}>
        <img src={orbSvg(120, 2.4)} width={64} height={64} alt="" />
      </div>
    ),
    size,
  );
}
