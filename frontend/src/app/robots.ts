import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

/**
 * Crawl budget barriers aligned to real public routes.
 * Marketing pages (/how-it-works, /pricing, /materials, /insights) are indexable.
 * Private app surfaces stay disallowed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/how-it-works",
          "/pricing",
          "/materials",
          "/insights",
          "/insights/",
          "/contact",
          "/legal/",
        ],
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
