import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

/**
 * Crawl budget barriers aligned to real public routes.
 * (There are no /features, /pricing, or /about pages — those live on /.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/contact", "/legal/"],
        disallow: [
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/dashboard/",
          "/admin/",
          "/onboarding/",
          "/api/",
          "/app/",
          "/*?*",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
