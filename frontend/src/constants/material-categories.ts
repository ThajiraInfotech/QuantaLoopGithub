/** Canonical MVP material category groups for matching and onboarding. */
export const MATERIAL_CATEGORY_GROUPS = [
  "Plastic Waste",
  "Paper & Cardboard Waste",
  "Metal Waste",
  "E-Waste",
  "Glass Waste",
  "Rubber Waste",
  "Textile Waste",
  "Wood Waste",
  "Organic/Biodegradable Waste",
  "Construction & Demolition Waste",
  "Chemical Waste",
  "Battery Waste",
  "Industrial By-products",
  "Hazardous Waste",
  "Leather & Footwear Waste",
  "Pharmaceutical & Biomedical Waste",
  "Oil & Petrochemical Waste",
  "Composite & Multi-layer Waste",
  "Mining & Mineral Waste",
  "Wastewater & Sludge",
  "Gas & Emission Control Waste",
] as const;

export type MaterialCategoryGroup = (typeof MATERIAL_CATEGORY_GROUPS)[number];

const CATEGORY_LOOKUP = new Map(
  MATERIAL_CATEGORY_GROUPS.map((category) => [
    category.trim().toLowerCase(),
    category,
  ])
);

const LEGACY_STREAM_TO_CATEGORY: Record<string, MaterialCategoryGroup> = {
  hdpe: "Plastic Waste",
  ldpe: "Plastic Waste",
  pet: "Plastic Waste",
  "mixed plastic scrap": "Plastic Waste",
  "paper bales": "Paper & Cardboard Waste",
  paper: "Paper & Cardboard Waste",
  cardboard: "Paper & Cardboard Waste",
  copper: "Metal Waste",
  aluminium: "Metal Waste",
  aluminum: "Metal Waste",
  "textile offcuts": "Textile Waste",
  textile: "Textile Waste",
  "e-waste": "E-Waste",
  ewaste: "E-Waste",
  "spent solvents": "Chemical Waste",
};

export function isMaterialCategoryGroup(
  value: string
): value is MaterialCategoryGroup {
  return CATEGORY_LOOKUP.has(value.trim().toLowerCase());
}

/** Map legacy stream labels and free text to a canonical category. */
export function normalizeMaterialCategory(value: string): string {
  const key = value.trim().toLowerCase();
  if (!key) return "";
  if (CATEGORY_LOOKUP.has(key)) return CATEGORY_LOOKUP.get(key)!;

  const legacy = LEGACY_STREAM_TO_CATEGORY[key];
  if (legacy) return legacy;

  for (const [stream, category] of Object.entries(LEGACY_STREAM_TO_CATEGORY)) {
    if (key.includes(stream) || stream.includes(key)) return category;
  }

  for (const category of MATERIAL_CATEGORY_GROUPS) {
    const categoryKey = category.toLowerCase();
    if (key === categoryKey || key.includes(categoryKey) || categoryKey.includes(key)) {
      return category;
    }
  }

  return value.trim();
}
