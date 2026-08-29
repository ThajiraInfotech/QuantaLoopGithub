/** Canonical MVP material category groups for matching. */
const MATERIAL_CATEGORY_GROUPS = [
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
  "Others",
];

const CATEGORY_LOOKUP = new Map(
  MATERIAL_CATEGORY_GROUPS.map((c) => [normKey(c), c])
);

/** Legacy stream labels → canonical category (backward compatibility). */
const LEGACY_STREAM_TO_CATEGORY = {
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
  other: "Others",
};

function normKey(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

function normalizeCategory(value) {
  const key = normKey(value);
  if (!key) return "";
  if (CATEGORY_LOOKUP.has(key)) return CATEGORY_LOOKUP.get(key);
  if (LEGACY_STREAM_TO_CATEGORY[key]) return LEGACY_STREAM_TO_CATEGORY[key];
  for (const [legacy, category] of Object.entries(LEGACY_STREAM_TO_CATEGORY)) {
    if (key.includes(legacy) || legacy.includes(key)) return category;
  }
  for (const category of MATERIAL_CATEGORY_GROUPS) {
    const ck = normKey(category);
    if (key === ck || key.includes(ck) || ck.includes(key)) return category;
  }
  return (value ?? "").toString().trim();
}

function normalizeCategoryList(values) {
  if (!Array.isArray(values)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of values) {
    const c = normalizeCategory(raw);
    const k = normKey(c);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

function categoriesOverlap(left, right) {
  const a = new Set(normalizeCategoryList(left).map(normKey));
  const b = normalizeCategoryList(right).map(normKey);
  if (!a.size || !b.length) return false;
  return b.some((x) => a.has(x));
}

function getBuyerCategories(user) {
  const primary = user?.requiredMaterialCategories;
  if (Array.isArray(primary) && primary.length) {
    return normalizeCategoryList(primary);
  }
  return normalizeCategoryList(user?.materialTypes);
}

function getProviderCategories(user) {
  const primary = user?.preferredMaterialCategories;
  if (Array.isArray(primary) && primary.length) {
    return normalizeCategoryList(primary);
  }
  return normalizeCategoryList(user?.materialTypes);
}

function resolveMaterialCategory(material, provider) {
  const fromType = normalizeCategory(material?.materialType);
  if (CATEGORY_LOOKUP.has(normKey(fromType))) return fromType;
  const providerCats = getProviderCategories(provider ?? {});
  if (providerCats.length === 1) return providerCats[0];
  for (const c of providerCats) {
    if (normKey(c) === normKey(fromType)) return c;
  }
  return fromType;
}

function scoreMaterialCategory(buyerCategories, materialCategory) {
  const buyer = normalizeCategoryList(buyerCategories);
  const material = normalizeCategory(materialCategory);
  if (!buyer.length || !material) return 0;
  const mk = normKey(material);
  return buyer.some((c) => normKey(c) === mk) ? 70 : 0;
}

module.exports = {
  MATERIAL_CATEGORY_GROUPS,
  normalizeCategory,
  normalizeCategoryList,
  categoriesOverlap,
  getBuyerCategories,
  getProviderCategories,
  resolveMaterialCategory,
  scoreMaterialCategory,
};
