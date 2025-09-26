import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SellOnMap";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0ea5e9,#0369a1)",
          color: "white",
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        <div style={{ fontSize: 84, lineHeight: 1 }}>SellOnMap</div>
        <div style={{ fontSize: 28, marginTop: 16 }}>Buy & Sell Near You</div>
      </div>
    ),
    {
      ...size,
    }
  );
}


