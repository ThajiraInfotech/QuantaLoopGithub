import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Quanta Loop — B2B industrial materials & scrap recycling marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #0f1416 0%, #163028 55%, #1a3d2e 100%)",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#2baa6b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            Q
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ color: "#ffffff", fontSize: 36, fontWeight: 700 }}>
              Quanta Loop
            </span>
            <span style={{ color: "#9ad4b5", fontSize: 20, marginTop: 4 }}>
              quantaloop.in
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.15,
              maxWidth: 960,
            }}
          >
            B2B industrial materials & scrap recycling marketplace
          </div>
          <div
            style={{
              color: "#c5e6d4",
              fontSize: 26,
              lineHeight: 1.35,
              maxWidth: 900,
            }}
          >
            Smart matching for Indian businesses buying and selling recyclable
            and industrial materials.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            color: "#8fbfa6",
            fontSize: 20,
          }}
        >
          <span>Unlimited listings</span>
          <span>·</span>
          <span>Registered businesses</span>
          <span>·</span>
          <span>₹6,999 / $99 · same membership</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
