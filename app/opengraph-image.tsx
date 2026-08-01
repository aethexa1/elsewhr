// elsewhr — the social card: what every shared link unfurls into.
// New file: app/opengraph-image.tsx
// Next.js renders this to a 1200x630 PNG at request time. No design tools, no uploads.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "elsewhr — find your people before day one";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 90px",
          background: "#ff5d3b",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 110, fontWeight: 800, color: "#fff6ec", letterSpacing: "-4px" }}>elsewhr</span>
          <span style={{ fontSize: 110, fontWeight: 800, color: "#c8f000" }}>.</span>
        </div>
        <div style={{ display: "flex", marginTop: 26 }}>
          <span style={{ fontSize: 42, color: "#fff6ec", lineHeight: 1.25 }}>
            new school, new city, new shift — find your people before day one.
          </span>
        </div>
        <div style={{ display: "flex", marginTop: 54, gap: 18 }}>
          {["🌍 worlds", "🏠 roommates", "💬 chat", "🗓 my week", "🐦 ask the bird"].map((t) => (
            <span
              key={t}
              style={{
                display: "flex",
                padding: "14px 26px",
                background: "#fff6ec",
                color: "#1c1410",
                borderRadius: 999,
                fontSize: 27,
                fontWeight: 700,
                border: "4px solid #1c1410",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
