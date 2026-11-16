import type { InsightArticle } from "@/content/insights/types";

export const INSIGHT_ARTICLES: InsightArticle[] = [
  {
    slug: "sell-factory-plastic-scrap-india",
    title: "How to Sell Factory Plastic Scrap in India",
    description:
      "A practical guide for manufacturers listing HDPE, LDPE, PET, and mixed plastic scrap — from grading basics to finding registered buyers on Quanta Loop.",
    datePublished: "2026-03-10",
    dateModified: "2026-03-10",
    keywords: [
      "sell plastic scrap India",
      "factory plastic waste",
      "HDPE scrap buyers",
      "industrial plastic recycling",
    ],
    readingMinutes: 6,
    sections: [
      {
        heading: "Start with clear material detail",
        paragraphs: [
          "Buyers move faster when listings describe polymer type, form (bale, flake, lump), approximate monthly volume, and location. You do not need a laboratory certificate on day one, but honesty about contamination and moisture prevents wasted discussions.",
          "Group lots by similar grades when you can. Mixed loads sell, but clean, consistent streams usually attract stronger interest and clearer pricing conversations.",
        ],
      },
      {
        heading: "Match with registered businesses, not random leads",
        paragraphs: [
          "Industrial plastic recovery works best when both sides are identifiable businesses. Quanta Loop connects material providers with registered buyers and recyclers so introductions happen inside a structured network rather than ad-hoc broker chats.",
          "List your plastic category, set quantity expectations, and respond promptly when interest arrives. Speed and clarity often matter as much as price in first conversations.",
        ],
      },
      {
        heading: "Close the loop on logistics and documentation",
        paragraphs: [
          "Agree pickup vs delivery, vehicle type, and weighing terms before dispatch. Keep basic dispatch records — even for non-hazardous plastic — so both parties can reconcile tonnage and invoices.",
          "One successful recurring plastic stream can recover annual membership cost many times over. Treat the first deal as a process template for the next lots.",
        ],
      },
    ],
  },
  {
    slug: "metal-scrap-categories-buyers-look-for",
    title: "Metal Scrap Categories Buyers Look For",
    description:
      "What industrial metal buyers typically ask for — ferrous vs non-ferrous, copper and aluminium lots, and how to list scrap clearly on Quanta Loop.",
    datePublished: "2026-03-17",
    keywords: [
      "metal scrap buyers",
      "copper scrap India",
      "aluminium scrap",
      "ferrous scrap",
    ],
    readingMinutes: 5,
    sections: [
      {
        heading: "Separate ferrous and non-ferrous early",
        paragraphs: [
          "Most buyers organise procurement around metal families. Keeping steel/iron lots distinct from copper, aluminium, brass, or stainless reduces sorting cost and improves response quality.",
          "If a factory generates mixed metal, note the dominant fraction and whether sorting is possible on site. Transparency helps buyers decide whether a visit or sample is needed.",
        ],
      },
      {
        heading: "Lead with form, not only chemistry",
        paragraphs: [
          "Turnings, solids, cables, radiators, and sheet offcuts behave differently in logistics and pricing. State form, estimated weight, and packing (loose, pallet, drum) in your listing.",
          "For copper and aluminium especially, buyers look for consistent supply. Mention if the stream is one-off demolition scrap or a recurring production residue.",
        ],
      },
      {
        heading: "Use the network to qualify counterparts",
        paragraphs: [
          "On Quanta Loop, list under Metal Waste and engage registered buyers who already signal interest in similar materials. Keep discussions on commercial terms, pickup windows, and payment norms.",
          "Avoid overselling purity. Accurate descriptions build repeat deals; inflated grades create disputes and weak reputation inside the network.",
        ],
      },
    ],
  },
  {
    slug: "e-waste-compliance-basics-manufacturers",
    title: "E-Waste Compliance Basics for Manufacturers",
    description:
      "High-level e-waste handling basics for Indian manufacturers — authorised channels, documentation habits, and how Quanta Loop helps you find qualified recovery partners.",
    datePublished: "2026-03-24",
    keywords: [
      "e-waste compliance India",
      "IT asset disposal",
      "e-waste recyclers",
      "manufacturer e-waste",
    ],
    readingMinutes: 7,
    sections: [
      {
        heading: "Treat e-waste as a controlled stream",
        paragraphs: [
          "Electronics scrap is not the same as general factory waste. Batteries, boards, and IT assets may fall under specialised rules. Your first job is to identify what you generate and whether an authorised recycler is required.",
          "This article is practical orientation, not legal advice. Confirm current obligations with your compliance team or counsel before large disposals.",
        ],
      },
      {
        heading: "Document origin, quantity, and destination",
        paragraphs: [
          "Keep a simple chain of custody: what left the site, when, and to whom. Photos of lots, weighbridge slips, and acknowledgements from the receiving facility reduce audit friction later.",
          "Data-bearing devices need an explicit wipe or destruction plan before or during handover. Align that process before the truck arrives.",
        ],
      },
      {
        heading: "Find recovery partners through a registered network",
        paragraphs: [
          "Quanta Loop’s E-Waste category helps manufacturers discover registered businesses interested in electronics recovery streams. Use listings to describe asset types, approximate volumes, and location.",
          "Prioritise counterparts who can speak clearly about authorisation and documentation. A slightly slower, compliant path beats an informal disposal that creates future liability.",
        ],
      },
    ],
  },
  {
    slug: "list-materials-and-close-deals-on-quanta-loop",
    title: "How to List Materials and Close Deals on Quanta Loop",
    description:
      "Step-by-step guidance for providers and buyers: create your profile, list materials, respond to interest, and move from match to commercial discussion.",
    datePublished: "2026-03-31",
    keywords: [
      "Quanta Loop how to list",
      "B2B scrap marketplace India",
      "industrial materials matching",
      "sell factory scrap online",
    ],
    readingMinutes: 5,
    sections: [
      {
        heading: "Complete a trustworthy business profile",
        paragraphs: [
          "Registered participation is the trust layer of Quanta Loop. Finish onboarding with accurate business details, role (provider or buyer), and material interests so recommendations stay relevant.",
          "Membership includes a 30-day free trial so you can list and test conversations before committing annually.",
        ],
      },
      {
        heading: "List with intent, not keywords",
        paragraphs: [
          "Choose the right category, add quantity and location context, and write a short commercial description a buyer can act on. Vague listings attract vague interest.",
          "Buyers should mirror that clarity in interest messages: what they need, typical volumes, and service areas.",
        ],
      },
      {
        heading: "Move from interest to a real discussion",
        paragraphs: [
          "When interest arrives, respond with logistics windows and any constraints (hazardous handling, loading hours, minimum lots). Use the platform conversation to keep context in one place.",
          "Successful members treat Quanta Loop as a repeat channel: refresh listings, keep profiles current, and convert one-off lots into scheduled recovery streams.",
        ],
      },
    ],
  },
];

export function getInsightArticles(): InsightArticle[] {
  return [...INSIGHT_ARTICLES].sort((a, b) =>
    a.datePublished < b.datePublished ? 1 : -1
  );
}

export function getInsightArticleBySlug(
  slug: string
): InsightArticle | undefined {
  return INSIGHT_ARTICLES.find((article) => article.slug === slug);
}
