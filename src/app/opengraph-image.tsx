import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SellOnMap";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Get the logo image as base64
  const logoResponse = await fetch(
    new URL('/sellonmap-original.png', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  );
  const logoArrayBuffer = await logoResponse.arrayBuffer();
  const logoBase64 = `data:image/png;base64,${Buffer.from(logoArrayBuffer).toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0ea5e9,#0369a1)",
          color: "white",
          fontWeight: 700,
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "40px",
          }}
        >
          <img
            src={logoBase64}
            width="120"
            height="120"
            style={{
              borderRadius: "12px",
              backgroundColor: "white",
              padding: "12px",
            }}
            alt="SellOnMap Logo"
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 72, lineHeight: 1, marginBottom: "8px" }}>SellOnMap</div>
          <div style={{ fontSize: 32, opacity: 0.9 }}>Buy & Sell Near You</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}


