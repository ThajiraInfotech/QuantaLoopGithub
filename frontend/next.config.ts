import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
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
