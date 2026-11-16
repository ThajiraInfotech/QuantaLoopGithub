/**
 * Canonical marketing SEO constants for public pages.
 * Private routes (dashboard, admin, auth, onboarding, API) must stay noindex.
 */

export const SITE_URL = "https://quantaloop.in";
export const SITE_NAME = "Quanta Loop";

export const DEFAULT_TITLE =
  "Quanta Loop | Buy & Sell Recyclable & Industrial Materials India";

export const DEFAULT_DESCRIPTION =
  "Sell recyclable materials or find materials for your business. Connect with registered buyers and suppliers for paper, plastic, metal, e-waste, scrap, and industrial byproducts across India.";

export const OG_TITLE =
  "Quanta Loop — Buy & Sell Recyclable & Industrial Materials";

export const OG_DESCRIPTION =
  "Sell recyclable materials or find materials for your business. Connect with registered buyers and suppliers in one trusted network.";
/** Absolute asset URLs used in Open Graph / JSON-LD (no spaces in paths). */
export const LOGO_URL = `${SITE_URL}/icon.png`;

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

/** Search Console + authority checklist (Phase C ops — not rendered on-site). */
export const SEO_OPS_CHECKLIST = [
  "Verify quantaloop.in in Google Search Console and submit /sitemap.xml",
  "Monitor Coverage, brand query sitelinks, and Insights impressions weekly",
  "Keep NAP/brand consistent on LinkedIn, directories, and partner pages",
  "Earn editorial links from recycling associations, industry blogs, and PR",
  "Encourage branded searches in sales outreach (search Quanta Loop)",
  "Refresh Insights posts quarterly; avoid daily thin content",
  "Never open /dashboard, /admin, /onboarding, or auth routes to indexing",
] as const;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized === "/" ? "" : normalized}`;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildArticleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  keywords?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    mainEntityOfPage: absoluteUrl(input.path),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: LOGO_URL,
      },
    },
    image: [`${SITE_URL}/og-image.png`],
    keywords: input.keywords?.join(", "),
    inLanguage: "en-IN",
  };
}

export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
    "max-snippet": 0,
    "max-image-preview": "none" as const,
    "max-video-preview": 0,
  },
};

export const INDEX_ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
    "max-snippet": -1,
  },
};

/** Master JSON-LD graph for homepage / main landing (SSR). */
export function buildHomeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: LOGO_URL,
        description:
          "B2B marketplace for industrial waste, scrap, recyclables, and byproduct recovery — connecting material providers with registered buyers across India.",
        address: {
          "@type": "PostalAddress",
          addressCountry: "IN",
        },
        email: "grievance@quantaloop.in",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-IN",
        hasPart: [
          {
            "@type": "WebPage",
            name: "How Quanta Loop Works",
            url: `${SITE_URL}/how-it-works`,
          },
          {
            "@type": "WebPage",
            name: "Pricing & Network Membership",
            url: `${SITE_URL}/pricing`,
          },
          {
            "@type": "WebPage",
            name: "Material Categories",
            url: `${SITE_URL}/materials`,
          },
          {
            "@type": "WebPage",
            name: "Insights",
            url: `${SITE_URL}/insights`,
          },
          {
            "@type": "WebPage",
            name: "Contact",
            url: `${SITE_URL}/contact`,
          },
        ],
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/#service`,
        name: "Quanta Loop Industrial Materials Matching Network",
        serviceType:
          "B2B Industrial Materials, Scrap & Recycling Marketplace",
        provider: { "@id": `${SITE_URL}/#organization` },
        description:
          "Proximity-based digital network connecting manufacturers and material providers with registered buyers, processors, and recovery operators for plastic, metal, e-waste, paper, and other industrial materials.",
        keywords:
          "industrial materials, scrap recycling, waste management India, scrap dealer, factory scrap, plastic recycling, metal scrap, e-waste, byproduct recovery, B2B marketplace",
        areaServed: {
          "@type": "Country",
          name: "India",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "B2B Material & Recycling Categories",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Industrial Scrap & Material Matching",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Hazardous & Non-Hazardous Material Categories",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Plastic, Metal, E-Waste & Recyclables Trading Access",
              },
            },
          ],
        },
        offers: [
          {
            "@type": "Offer",
            name: "Network Membership — India",
            price: "6999.00",
            priceCurrency: "INR",
            description:
              "Annual network membership for businesses billing in India. Unlimited listings, matching, and buyer connections. GST inclusive. 30-day free trial available.",
            priceSpecification: {
              "@type": "PriceSpecification",
              price: "6999.00",
              priceCurrency: "INR",
              valueAddedTaxIncluded: true,
            },
          },
          {
            "@type": "Offer",
            name: "Network Membership — Outside India",
            price: "99.00",
            priceCurrency: "USD",
            description:
              "Same annual network membership for businesses billing outside India. Unlimited listings, matching, and buyer connections. 30-day free trial available.",
            priceSpecification: {
              "@type": "PriceSpecification",
              price: "99.00",
              priceCurrency: "USD",
            },
          },
        ],
      },
    ],
  };
}
