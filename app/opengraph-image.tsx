import { ImageResponse } from "next/og";
export const alt = "LOVE — Nightlife & hospitality in Indianapolis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OG() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#110d0e",
        color: "#f1e8e0",
        padding: 65,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 62,
          fontWeight: 900,
          letterSpacing: -5,
        }}
      >
        LOVE<span style={{ color: "#d9ad91" }}>.</span>
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "sans-serif",
          fontSize: 84,
          fontWeight: 700,
          maxWidth: 800,
          lineHeight: 1.05,
        }}
      >
        Stay for what happens next.
      </div>
      <div
        style={{
          display: "flex",
          borderTop: "1px solid #f1e8e044",
          paddingTop: 25,
          fontSize: 22,
          justifyContent: "space-between",
        }}
      >
        <span>Indianapolis, Indiana</span>
        <span>Nightlife & hospitality</span>
      </div>
    </div>,
    size,
  );
}
