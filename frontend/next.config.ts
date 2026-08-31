import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const devApiOrigin = (
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:5000"
);

const nextConfig: NextConfig = {
  /** Allow phone/tablet testing on the same Wi‑Fi during `npm run dev` */
  allowedDevOrigins: [
    "192.168.1.5",
    "192.168.1.3",
    "172.29.208.1",
    "localhost",
    "127.0.0.1",
  ],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/dashboard/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
    ];
  },
  async rewrites() {
    if (process.env.NODE_ENV === "production") {
      return [];
    }
    return [
      {
        source: "/api/v1/:path*",
        destination: `${devApiOrigin}/api/v1/:path*`,
      },
      {
        source: "/uploads/materials/:path*",
        destination: `${devApiOrigin}/uploads/materials/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/materials/**",
      },
      {
        protocol: "https",
        hostname: "www.quantaloop.in",
        pathname: "/uploads/materials/**",
      },
      {
        protocol: "https",
        hostname: "quantaloop.in",
        pathname: "/uploads/materials/**",
      },
      {
        protocol: "http",
        hostname: "187.127.171.192",
        pathname: "/uploads/materials/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
