const {
  getBuyerCategories,
  getProviderCategories,
  resolveMaterialCategory,
  scoreMaterialCategory,
  categoriesOverlap,
} = require("../../utils/materialCategories");
const {
  resolveUserLocation,
  resolveMaterialLocation,
  scoreLocationMatch,
} = require("../../utils/locationMatch");

const NOTIFY_SCORE_THRESHOLD = 75;
const RECOMMEND_MIN_SCORE = 50;

function getMatchLabel(score) {
  if (score >= 90) return "Excellent Match";
  if (score >= 75) return "Strong Match";
  if (score >= 50) return "Relevant Match";
  return null;
}

function getPriorityFromScore(score) {
  if (score >= 90) return "high";
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "standard";
}

/**
 * Score buyer ↔ material listing (0–100).
 * Material category = 70 pts, location = 30 pts.
 */
function scoreMaterialForBuyer(material, buyer, provider) {
  const buyerCats = getBuyerCategories(buyer);
  const materialCat = resolveMaterialCategory(material, provider);
  const materialScore = scoreMaterialCategory(buyerCats, materialCat);
  const buyerLoc = resolveUserLocation(buyer);
  const sellerLoc = resolveMaterialLocation(material, provider);
  const locationScore = scoreLocationMatch(buyerLoc, sellerLoc);
  const total = materialScore + locationScore;
  return {
    total,
    materialScore,
    locationScore,
    materialCategory: materialCat,
    matchLabel: getMatchLabel(total),
    priority: getPriorityFromScore(total),
    buyerLocation: buyerLoc,
    sellerLocation: sellerLoc,
  };
}

/**
 * Score provider ↔ buyer for participant recommendations (0–100).
 */
function scoreBuyerForProvider(buyer, provider) {
  const buyerCats = getBuyerCategories(buyer);
  const providerCats = getProviderCategories(provider);
  const materialScore = categoriesOverlap(buyerCats, providerCats) ? 70 : 0;
  const buyerLoc = resolveUserLocation(buyer);
  const providerLoc = resolveUserLocation(provider);
  const locationScore = scoreLocationMatch(buyerLoc, providerLoc);
  const total = materialScore + locationScore;
  return {
    total,
    materialScore,
    locationScore,
    matchLabel: getMatchLabel(total),
    priority: getPriorityFromScore(total),
    buyerLocation: buyerLoc,
    providerLocation: providerLoc,
  };
}

/** @deprecated Use scoreMaterialForBuyer(...).total for backward-compatible call sites. */
function scoreMaterialForBuyerLegacy(material, buyer, provider) {
  return scoreMaterialForBuyer(material, buyer, provider).total;
}

module.exports = {
  NOTIFY_SCORE_THRESHOLD,
  RECOMMEND_MIN_SCORE,
  getMatchLabel,
  getPriorityFromScore,
  scoreMaterialForBuyer,
  scoreBuyerForProvider,
  scoreMaterialForBuyerLegacy,
};
