import { ImageResponse } from "next/og";
import { orbSvg } from "@/lib/orbSvg";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#050506" }}>
        <img src={orbSvg(320, 1.3)} width={150} height={150} alt="" />
      </div>
    ),
    size,
  );
}
