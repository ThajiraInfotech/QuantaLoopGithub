import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  OG_DESCRIPTION,
  OG_TITLE,
  SITE_URL,
  buildHomeJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: DEFAULT_TITLE,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: SITE_URL,
    type: "website",
  },
};

export default async function HomePage() {
  const jsonLd = buildHomeJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
