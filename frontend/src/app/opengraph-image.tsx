import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Quanta Loop — Buy and sell recyclable and industrial materials";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share preview aligned to the current light landing hero (not the old dark card). */
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
          background: "#ffffff",
          padding: "56px 64px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Soft brand wash */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 520,
            height: 520,
            background:
              "radial-gradient(circle at 70% 20%, rgba(43,170,107,0.14) 0%, rgba(255,255,255,0) 65%)",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: "#2baa6b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              Q
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{ color: "#0f1416", fontSize: 32, fontWeight: 700 }}
              >
                Quanta Loop
              </span>
              <span style={{ color: "#5c6670", fontSize: 18, marginTop: 2 }}>
                Recoverable Material Network
              </span>
            </div>
          </div>
          <span style={{ color: "#2baa6b", fontSize: 20, fontWeight: 600 }}>
            quantaloop.in
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 980,
          }}
        >
          <div
            style={{
              color: "#0f1416",
              fontSize: 54,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Buy and Sell</span>
            <span>Recyclable & Industrial Materials</span>
          </div>
          <div
            style={{
              color: "#5c6670",
              fontSize: 26,
              lineHeight: 1.4,
              maxWidth: 900,
            }}
          >
            Connect with registered buyers and suppliers. Paper, Plastic, Metal,
            E-Waste and more — any quantity.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "10px 18px",
              borderRadius: 999,
              background: "#e8f7ef",
              color: "#0f1416",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Smart matching
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 18px",
              borderRadius: 999,
              background: "#e8f7ef",
              color: "#0f1416",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Registered businesses
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 18px",
              borderRadius: 999,
              background: "#e8f7ef",
              color: "#0f1416",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Direct connections
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 18px",
              borderRadius: 999,
              background: "#e8f7ef",
              color: "#0f1416",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            ₹6,999 / $99 · year
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
