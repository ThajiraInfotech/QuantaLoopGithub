/**
 * Canonical marketing SEO constants for public pages.
 * Private routes (dashboard, admin, auth, onboarding, API) must stay noindex.
 */

export const SITE_URL = "https://quantaloop.in";
export const SITE_NAME = "Quanta Loop";

export const DEFAULT_TITLE =
  "Quanta Loop | B2B Industrial Materials & Scrap Recycling Marketplace India";

export const DEFAULT_DESCRIPTION =
  "B2B marketplace connecting Indian businesses with registered buyers and suppliers for industrial waste, scrap, recyclables, and byproducts. Smart proximity matching for material providers and buyers.";

export const OG_TITLE =
  "Quanta Loop — Industrial Materials, Scrap & Recycling Matching";

export const OG_DESCRIPTION =
  "List surplus materials or find what your business needs. Connect with registered buyers and suppliers across India through intelligent matching.";

/** Absolute asset URLs used in Open Graph / JSON-LD (no spaces in paths). */
export const LOGO_URL = `${SITE_URL}/icon.png`;

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
