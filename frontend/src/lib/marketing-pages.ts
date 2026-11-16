import type { FaqItem } from "@/lib/seo";
import {
  MATERIAL_CATEGORY_GROUPS,
  type MaterialCategoryGroup,
} from "@/constants/material-categories";

export const MARKETING_META = {
  howItWorks: {
    title: "How Quanta Loop Works",
    description:
      "See how material providers and buyers connect on Quanta Loop — list surplus or scrap, get matched with registered businesses, and close deals across India.",
  },
  pricing: {
    title: "Pricing & Network Membership",
    description:
      "Join Quanta Loop with a 30-day free trial. Annual membership is ₹6,999 in India or $99 abroad — unlimited listings and buyer connections.",
  },
  materials: {
    title: "Industrial & Recyclable Material Categories",
    description:
      "Browse Quanta Loop material categories — plastic, metal, paper, e-waste, industrial by-products, and more — for buyers and sellers across India.",
  },
  insights: {
    title: "Insights for Material Buyers & Sellers",
    description:
      "Practical guides on selling scrap, buying recyclables, compliance basics, and closing B2B material deals on Quanta Loop.",
  },
} as const;

export const HOW_IT_WORKS_FAQS: FaqItem[] = [
  {
    question: "Who can join Quanta Loop?",
    answer:
      "Registered businesses that generate, buy, process, or recover recyclable and industrial materials — manufacturers, traders, recyclers, and recovery operators.",
  },
  {
    question: "How does matching work?",
    answer:
      "You list materials or interests. Quanta Loop surfaces relevant counterparts based on material type, location, and network activity so you can start a structured discussion.",
  },
  {
    question: "Can I buy and sell any quantity?",
    answer:
      "Yes. Listings can range from small lots to multi-ton shipments. Quantity and logistics are agreed directly between registered businesses.",
  },
];

export const PRICING_FAQS: FaqItem[] = [
  {
    question: "What does membership include?",
    answer:
      "Unlimited material listings, access to registered buyers and suppliers, interest discovery, and direct business communication inside the network.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. New members get a 30-day free trial with no payment required to start. You can cancel during the trial.",
  },
  {
    question: "What is the annual price?",
    answer:
      "₹6,999 per year for businesses billing in India (GST inclusive) or $99 per year for businesses outside India.",
  },
];

export const MATERIALS_FAQS: FaqItem[] = [
  {
    question: "Which materials can I list?",
    answer:
      "Plastic, paper, metal, e-waste, glass, rubber, textiles, chemicals, industrial by-products, hazardous streams, and other recoverable categories supported on the network.",
  },
  {
    question: "Do I need exact grades before listing?",
    answer:
      "Share the best available detail — category, form, and quantity. Buyers can clarify grades and specs during the discussion.",
  },
  {
    question: "Are hazardous materials allowed?",
    answer:
      "Hazardous and regulated streams can be listed when your business is qualified to handle them. Compliance and documentation remain the parties’ responsibility.",
  },
];

export const INSIGHTS_FAQS: FaqItem[] = [
  {
    question: "How often does Quanta Loop publish Insights?",
    answer:
      "We aim for one high-quality guide each week, focused on practical buying and selling topics for the Indian industrial materials market.",
  },
  {
    question: "Who are Insights for?",
    answer:
      "Material providers, buyers, recyclers, and recovery operators who want clear, practical guidance on listing, sourcing, and closing deals in India.",
  },
];

const CATEGORY_BLURBS: Partial<Record<MaterialCategoryGroup, string>> = {
  "Plastic Waste":
    "HDPE, LDPE, PET, mixed plastic scrap, and industrial plastic offcuts for recyclers and manufacturers.",
  "Paper & Cardboard Waste":
    "Paper bales, cardboard, and fibre waste for mills, packagers, and recovery buyers.",
  "Metal Waste":
    "Ferrous and non-ferrous scrap including copper, aluminium, and mixed metal lots.",
  "E-Waste":
    "Electronics scrap and IT asset recovery streams for authorised recyclers and buyers.",
  "Glass Waste":
    "Cullet and industrial glass residues for remelt and secondary processing.",
  "Rubber Waste":
    "Rubber scrap, offcuts, and elastomer waste for reclaim and secondary markets.",
  "Textile Waste":
    "Fabric offcuts, apparel waste, and fibre residues for textile recyclers.",
  "Wood Waste":
    "Pallets, offcuts, and industrial wood residues for processors and biomass buyers.",
  "Organic/Biodegradable Waste":
    "Organic and biodegradable industrial streams suitable for recovery operators.",
  "Construction & Demolition Waste":
    "C&D materials and construction residues for specialised recovery buyers.",
  "Chemical Waste":
    "Spent solvents and chemical process residues for qualified handlers.",
  "Battery Waste":
    "Battery scrap and related streams for authorised recycling partners.",
  "Industrial By-products":
    "Process by-products that still hold value for other industrial buyers.",
  "Hazardous Waste":
    "Regulated hazardous streams for businesses equipped to handle compliance.",
  "Leather & Footwear Waste":
    "Leather cuttings and footwear manufacturing residues.",
  "Pharmaceutical & Biomedical Waste":
    "Qualified pharma and biomedical waste streams under applicable rules.",
  "Oil & Petrochemical Waste":
    "Oil, sludge, and petrochemical residues for specialised recovery.",
  "Composite & Multi-layer Waste":
    "Multi-layer and composite packaging waste for advanced recyclers.",
  "Mining & Mineral Waste":
    "Mineral and mining residues with secondary market potential.",
  "Wastewater & Sludge":
    "Industrial sludge and wastewater treatment residues.",
  "Gas & Emission Control Waste":
    "Emission-control residues and related industrial streams.",
  Others:
    "Other recoverable industrial materials that do not fit a primary category.",
};

export function slugifyMaterialCategory(category: string): string {
  return category
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type PublicMaterialCategory = {
  name: MaterialCategoryGroup;
  slug: string;
  description: string;
};

export function getPublicMaterialCategories(): PublicMaterialCategory[] {
  return MATERIAL_CATEGORY_GROUPS.map((name) => {
    const slug = slugifyMaterialCategory(name);
    return {
      name,
      slug,
      description:
        CATEGORY_BLURBS[name] ??
        `Buy and sell ${name.toLowerCase()} through Quanta Loop’s registered business network across India.`,
    };
  });
}
