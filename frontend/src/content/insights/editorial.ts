/**
 * Weekly Insights publishing playbook (public SEO hub).
 * Create/edit/publish from Admin → Insights.
 * Old dashboard operational Insights are retired.
 */
export const INSIGHTS_EDITORIAL_PLAYBOOK = {
  cadence: "weekly",
  targetPerMonth: "2–4 after the first 8–12 weekly pieces",
  standards: [
    "One clear search intent per article",
    "India-market specificity (process, compliance posture, logistics)",
    "Original angle — no thin AI rewrites",
    "Internal links to /materials, /pricing, and signup CTA",
    "Unique title + meta description (never reuse across pages)",
  ],
  topicSeeds: [
    "How to sell factory plastic scrap in India",
    "Metal scrap categories buyers look for",
    "E-waste compliance basics for manufacturers",
    "Listing materials and closing deals on Quanta Loop",
    "City/state guides only when you have real local substance",
  ],
  workflow: [
    "Admin → Insights → New insight",
    "Fill title, unique meta description, sections, language, tags",
    "Set status to Published",
    "Confirm live URL /insights/[slug] and sitemap pickup",
    "Request indexing in Google Search Console for new URLs",
    "Quarterly: refresh older posts instead of publishing daily fluff",
  ],
} as const;
