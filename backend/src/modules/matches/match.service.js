const mongoose = require("mongoose");

const { User } = require("../users/user.model");
const { Material } = require("../materials/material.model");
const { createNotification } = require("../notifications/notification.service");
const { newMatchingMaterial } = require("../../utils/notificationCopy");
const { isListedForNetworkBrowse } = require("../materials/material-status.helper");
const {
  NOTIFY_SCORE_THRESHOLD,
  RECOMMEND_MIN_SCORE,
  scoreMaterialForBuyer,
  scoreBuyerForProvider,
  getMatchLabel,
} = require("./mvp-match.service");
const {
  getBuyerCategories,
  getProviderCategories,
  categoriesOverlap,
} = require("../../utils/materialCategories");
const { resolveUserLocation, isSameState, isDifferentState, buildMatchLocationContext } = require("../../utils/locationMatch");
const {
  isIndiaCountry,
  isInternationallyVisible,
  normalizeCountryCode,
} = require("../../utils/marketScope");

const LISTABLE = ["available", "active", "in_discussion"];
const MAX_MATCH_NOTIFICATIONS = 24;

/**
 * @returns {number} Total match score 0–100 (backward-compatible signature).
 */
function scoreMaterialForBuyerTotal(material, buyer, provider) {
  const providerDoc =
    provider ??
    (material?.provider && typeof material.provider === "object"
      ? material.provider
      : null);
  return scoreMaterialForBuyer(material, buyer, providerDoc).total;
}

async function notifyBuyersOfNewMaterial(materialDoc) {
  if (!materialDoc || !isListedForNetworkBrowse(materialDoc.status)) return;
  if (materialDoc.visibility !== "network") return;

  const providerId = materialDoc.provider?.toString?.() ?? materialDoc.provider?.toString();
  const provider =
    materialDoc.provider && typeof materialDoc.provider === "object"
      ? materialDoc.provider
      : providerId
        ? await User.findById(providerId)
            .select("preferredMaterialCategories materialTypes state location country")
            .lean()
        : null;

  const buyers = await User.find({ role: "verified_buyer" })
    .select(
      "companyName name email requiredMaterialCategories materialTypes state location country role"
    )
    .lean()
    .limit(400);

  const listingIsInternational = isInternationallyVisible(materialDoc);
  let sent = 0;

  for (const buyer of buyers) {
    if (sent >= MAX_MATCH_NOTIFICATIONS) break;
    if (buyer._id.toString() === providerId) continue;

    const buyerIsAbroad = !isIndiaCountry(buyer.country);
    if (buyerIsAbroad && !listingIsInternational) continue;

    const match = scoreMaterialForBuyer(materialDoc, buyer, provider);
    if (match.total < NOTIFY_SCORE_THRESHOLD) continue;

    const matchCopy = newMatchingMaterial({
      materialTitle: materialDoc.title,
      materialType: materialDoc.materialType,
      location: materialDoc.location,
    });
    await createNotification({
      recipient: buyer._id,
      type: "new_matching_material",
      title: matchCopy.title,
      message: matchCopy.message,
      relatedMaterial: materialDoc._id,
      relatedInterest: null,
    });
    sent += 1;
  }
}

async function getBuyerMaterialSuggestions(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const buyer = await User.findById(uid).lean();
  if (!buyer || buyer.role !== "verified_buyer") {
    return { items: [] };
  }

  const materials = await Material.find({
    status: { $in: LISTABLE },
    visibility: "network",
    provider: { $ne: uid },
  })
    .populate(
      "provider",
      "preferredMaterialCategories materialTypes state location country companyName"
    )
    .sort({ updatedAt: -1 })
    .limit(80)
    .lean();

  const buyerCountry = normalizeCountryCode(buyer.country);
  const visible = isIndiaCountry(buyerCountry)
    ? materials
    : materials.filter((m) => isInternationallyVisible(m));

  const ranked = visible
    .map((m) => {
      const provider =
        m.provider && typeof m.provider === "object" ? m.provider : null;
      const match = scoreMaterialForBuyer(m, buyer, provider);
      return { material: m, match };
    })
    .filter((x) => x.match.total >= RECOMMEND_MIN_SCORE)
    .sort((a, b) => b.match.total - a.match.total)
    .slice(0, 8);

  return {
    items: ranked.map(({ material: m, match }) => {
      const buyerLoc = resolveUserLocation(buyer);
      const locationContext = buildMatchLocationContext(
        buyerLoc,
        match.sellerLocation ?? {}
      );
      const headline =
        (locationContext.locationScope === "other_state" ||
          locationContext.locationScope === "same_country") &&
        locationContext.locationNote
          ? `${match.matchLabel ?? "Relevant Match"} — ${locationContext.locationNote}`
          : match.matchLabel ?? "Relevant Match";

      return {
        materialId: m._id.toString(),
        title: m.title,
        materialType: m.materialType,
        location: m.location,
        country: normalizeCountryCode(m.country ?? match.sellerLocation?.country),
        marketScope: m.marketScope === "global" ? "global" : "india",
        providerCompany:
          m.provider && typeof m.provider === "object"
            ? m.provider.companyName ?? ""
            : "",
        score: match.total,
        matchLabel: match.matchLabel,
        sellerState: match.sellerLocation?.state ?? "",
        sellerCity: match.sellerLocation?.city ?? "",
        sellerCountry: match.sellerLocation?.country ?? "IN",
        locationScope: locationContext.locationScope,
        locationNote: locationContext.locationNote,
        headline,
      };
    }),
  };
}

async function getProviderMatchSignals(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const provider = await User.findById(uid).lean();
  if (!provider || provider.role !== "material_provider") {
    return { headlines: [], buyers: [] };
  }

  const providerCats = getProviderCategories(provider);
  if (!providerCats.length) {
    return {
      headlines: ["Add material categories to unlock buyer matches."],
      buyers: [],
    };
  }

  const providerLoc = resolveUserLocation(provider);
  const buyers = await User.find({ role: "verified_buyer" })
    .select(
      "companyName requiredMaterialCategories materialTypes location state verificationStatus createdAt updatedAt averageResponseTime responseRate"
    )
    .lean()
    .limit(200);

  const ranked = buyers
    .map((b) => {
      const match = scoreBuyerForProvider(b, provider);
      const reasons = [];
      if (match.materialScore > 0) reasons.push("Material category match");
      if (match.locationScore === 30) reasons.push("Same city");
      else if (match.locationScore === 15) reasons.push("Same state");
      return { buyer: b, match, reasons };
    })
    .filter((x) => x.match.total >= RECOMMEND_MIN_SCORE)
    .sort((a, b) => b.match.total - a.match.total)
    .slice(0, 12);

  const headlines = [];
  if (providerLoc.city) {
    headlines.push(`Buyers near ${providerLoc.city}`);
  } else if (providerLoc.state) {
    headlines.push(`Buyers in ${providerLoc.state}`);
  }
  if (providerCats.length) {
    headlines.push("Aligned to your material categories");
  }

  return {
    headlines,
    buyers: ranked.map(({ buyer: b, match, reasons }) => ({
      buyerId: b._id.toString(),
      companyName: b.companyName,
      location: b.location ?? "",
      state: b.state ?? "",
      city: b.location ?? "",
      industryType: b.industryType ?? "",
      matchPercent: match.total,
      score: match.total,
      matchLabel: match.matchLabel,
      reasons,
      verificationStatus: b.verificationStatus ?? "unverified",
      memberSince: b.createdAt,
      lastActiveAt: b.updatedAt,
      averageResponseTime: b.averageResponseTime ?? "",
      responseRate: b.responseRate ?? 0,
      materialInterests: getBuyerCategories(b).slice(0, 5),
    })),
  };
}

module.exports = {
  scoreMaterialForBuyer: scoreMaterialForBuyerTotal,
  notifyBuyersOfNewMaterial,
  getBuyerMaterialSuggestions,
  getProviderMatchSignals,
  NOTIFY_SCORE_THRESHOLD,
  RECOMMEND_MIN_SCORE,
  getMatchLabel,
  categoriesOverlap,
  isSameState,
  isDifferentState,
};
