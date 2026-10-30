import { ImageResponse } from "next/og";
import { orbSvg } from "@/lib/orbSvg";

export const alt = "Ask Rounak: talk to an AI version of Rounak";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 64, padding: "0 96px", background: "#050506", color: "#f4f4f6" }}>
        <img src={orbSvg(700, 0.7)} width={420} height={420} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>Ask Rounak</div>
          <div style={{ fontSize: 32, color: "#8b8b94", maxWidth: 540, lineHeight: 1.4 }}>
            A voice bot that answers interview questions the way Rounak would.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
