const mongoose = require("mongoose");

const { User } = require("../users/user.model");
const { Material } = require("../materials/material.model");
const {
  getBuyerMaterialSuggestions,
  getProviderMatchSignals,
} = require("../matches/match.service");
const {
  RECOMMEND_MIN_SCORE,
  scoreMaterialForBuyer,
  scoreBuyerForProvider,
  getMatchLabel,
} = require("../matches/mvp-match.service");
const {
  resolveUserLocation,
  isSameState,
  isDifferentState,
  isSameCountry,
  buildMatchLocationContext,
} = require("../../utils/locationMatch");
const {
  isIndiaCountry,
  isOutsideIndiaListing,
  isInternationallyVisible,
  normalizeCountryCode,
} = require("../../utils/marketScope");

const LISTABLE = ["available", "active", "in_discussion"];

function materialRow(m, buyer, match, extras = {}) {
  const provider =
    m.provider && typeof m.provider === "object" ? m.provider : null;
  const buyerLoc = buyer ? resolveUserLocation(buyer) : { country: "IN", state: "", city: "" };
  const locationContext = buildMatchLocationContext(
    buyerLoc,
    match.sellerLocation ?? {}
  );
  const baseHeadline = extras.headline ?? match.matchLabel ?? "Relevant Match";
  const headline =
    (extras.sectionType === "materials_other_states" ||
      extras.sectionType === "materials_global" ||
      extras.sectionType === "materials_in_your_country") &&
    locationContext.locationNote
      ? `${baseHeadline} — ${locationContext.locationNote}`
      : baseHeadline;

  return {
    materialId: m._id.toString(),
    title: m.title,
    materialType: m.materialType,
    location: m.location,
    country: normalizeCountryCode(m.country ?? match.sellerLocation?.country),
    marketScope: m.marketScope === "global" ? "global" : "india",
    providerCompany: provider?.companyName ?? "",
    relevanceScore: match.materialScore,
    activityScore: match.locationScore,
    freshnessScore: 0,
    compositeScore: match.total,
    matchLabel: match.matchLabel,
    priority: match.priority,
    sellerState: match.sellerLocation?.state ?? "",
    sellerCity: match.sellerLocation?.city ?? "",
    sellerCountry: match.sellerLocation?.country ?? "IN",
    ...extras,
    locationScope: locationContext.locationScope,
    locationNote: locationContext.locationNote,
    headline,
  };
}

async function enrichMaterialRow(m, buyer, extras = {}) {
  const provider =
    m.provider && typeof m.provider === "object" ? m.provider : null;
  const match = buyer
    ? scoreMaterialForBuyer(m, buyer, provider)
    : {
        total: 0,
        materialScore: 0,
        locationScore: 0,
        matchLabel: null,
        priority: "standard",
      };
  return materialRow(m, buyer, match, extras);
}

/**
 * @param {object} user - req.user lean or doc
 */
async function getMaterialRecommendations(user) {
  const userId = user.id ?? user._id?.toString();
  const role = user.role;
  const sections = [];

  if (role === "verified_buyer") {
    const buyer = await User.findById(userId).lean();
    if (!buyer) return { sections: [] };

    const buyerLoc = resolveUserLocation(buyer);
    const materials = await Material.find({
      status: { $in: LISTABLE },
      visibility: "network",
      provider: { $ne: new mongoose.Types.ObjectId(userId) },
    })
      .populate(
        "provider",
        "companyName preferredMaterialCategories materialTypes state location country"
      )
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    const scored = [];
    for (const m of materials) {
      const provider =
        m.provider && typeof m.provider === "object" ? m.provider : null;
      const match = scoreMaterialForBuyer(m, buyer, provider);
      if (match.total < RECOMMEND_MIN_SCORE) continue;
      scored.push({ m, match });
    }

    scored.sort((a, b) => b.match.total - a.match.total);

    if (!isIndiaCountry(buyerLoc.country)) {
      const inCountry = scored
        .filter(
          ({ m, match }) =>
            isInternationallyVisible(m) &&
            isSameCountry(buyerLoc, match.sellerLocation)
        )
        .slice(0, 8)
        .map(({ m, match }) =>
          materialRow(m, buyer, match, {
            sectionType: "materials_in_your_country",
            headline: match.matchLabel ?? "Relevant Match",
          })
        );

      if (inCountry.length) {
        sections.push({
          id: "materials_in_your_country",
          title: "Materials in your country",
          subtitle: `Same material category in ${buyerLoc.country}.`,
          items: inCountry,
        });
      }
    } else {
      const indiaScored = scored.filter(
        ({ m }) => !isOutsideIndiaListing(m)
      );

      const nearYou = indiaScored
        .filter(({ match }) => isSameState(buyerLoc, match.sellerLocation))
        .slice(0, 8)
        .map(({ m, match }) =>
          materialRow(m, buyer, match, {
            sectionType: "materials_near_you",
            headline: match.matchLabel ?? "Relevant Match",
          })
        );

      const otherStates = indiaScored
        .filter(
          ({ match }) =>
            match.materialScore > 0 &&
            isDifferentState(buyerLoc, match.sellerLocation)
        )
        .slice(0, 8)
        .map(({ m, match }) =>
          materialRow(m, buyer, match, {
            sectionType: "materials_other_states",
            headline: match.matchLabel ?? "Relevant Match",
          })
        );

      const globalItems = scored
        .filter(({ m }) => isOutsideIndiaListing(m))
        .slice(0, 8)
        .map(({ m, match }) =>
          materialRow(m, buyer, match, {
            sectionType: "materials_global",
            headline: match.matchLabel ?? "Relevant Match",
          })
        );

      if (nearYou.length) {
        sections.push({
          id: "materials_near_you",
          title: "Materials Near You",
          subtitle:
            buyerLoc.state
              ? `Same material category in ${buyerLoc.state}.`
              : "Same material category in your state.",
          items: nearYou,
        });
      }
      if (otherStates.length) {
        sections.push({
          id: "materials_other_states",
          title: "Materials in Other States",
          subtitle: "Same material category — interstate discovery.",
          items: otherStates,
        });
      }
      if (globalItems.length) {
        sections.push({
          id: "materials_global",
          title: "Global materials",
          subtitle: "Materials listed outside India.",
          items: globalItems,
        });
      }
    }
  }

  if (role === "material_provider") {
    const provider = await User.findById(userId).lean();
    if (!provider) return { sections: [] };

    const materials = await Material.find({
      provider: userId,
      status: { $in: LISTABLE },
    })
      .sort({ updatedAt: -1 })
      .limit(12)
      .lean();

    const items = materials.map((m) => {
      const match = scoreMaterialForBuyer(m, provider, provider);
      return {
        materialId: m._id.toString(),
        title: m.title,
        materialType: m.materialType,
        location: m.location,
        activityScore: 0,
        freshnessScore: 0,
        compositeScore: match.total,
        matchLabel: match.matchLabel,
        priority: match.priority,
        headline: "Your published availability",
      };
    });

    if (items.length) {
      sections.push({
        id: "provider_active_listings",
        title: "Your active opportunities",
        subtitle: "Your published listings on the network.",
        items,
      });
    }
  }

  return { sections };
}

async function getParticipantRecommendations(user) {
  const userId = user.id ?? user._id?.toString();
  const role = user.role;
  const sections = [];

  if (role === "verified_buyer") {
    const buyer = await User.findById(userId).lean();
    if (!buyer) return { sections: [] };

    const buyerLoc = resolveUserLocation(buyer);
    const providers = await User.find({ role: "material_provider" })
      .select(
        "companyName location state preferredMaterialCategories materialTypes industryType"
      )
      .limit(120)
      .lean();

    const scored = [];
    for (const p of providers) {
      if (p._id.toString() === userId) continue;
      const match = scoreBuyerForProvider(buyer, p);
      if (match.total < RECOMMEND_MIN_SCORE) continue;
      scored.push({
        participantId: p._id.toString(),
        companyName: p.companyName,
        location: p.location ?? "",
        industryType: p.industryType ?? "",
        alignmentScore: match.materialScore,
        engagementScore: match.locationScore,
        compositeScore: match.total,
        matchLabel: match.matchLabel,
        priority: match.priority,
        headline: match.matchLabel ?? "Relevant Match",
        _match: match,
      });
    }

    scored.sort((a, b) => b.compositeScore - a.compositeScore);

    const nearYou = scored
      .filter((r) => isSameState(buyerLoc, r._match.providerLocation))
      .slice(0, 8)
      .map(({ _match, ...rest }) => rest);

    const otherStates = scored
      .filter(
        (r) =>
          r.alignmentScore > 0 &&
          isDifferentState(buyerLoc, r._match.providerLocation)
      )
      .slice(0, 8)
      .map(({ _match, ...rest }) => rest);

    if (nearYou.length) {
      sections.push({
        id: "providers_near_you",
        title: "Providers Near You",
        subtitle: "Material category alignment in your state.",
        items: nearYou,
      });
    }
    if (otherStates.length) {
      sections.push({
        id: "providers_other_states",
        title: "Providers in Other States",
        subtitle: "Category-aligned suppliers in other states.",
        items: otherStates,
      });
    }
  }

  if (role === "material_provider") {
    const provider = await User.findById(userId).lean();
    if (!provider) return { sections: [] };

    const providerLoc = resolveUserLocation(provider);
    const buyers = await User.find({ role: "verified_buyer" })
      .select(
        "companyName location state requiredMaterialCategories materialTypes industryType"
      )
      .limit(120)
      .lean();

    const scored = [];
    for (const b of buyers) {
      const match = scoreBuyerForProvider(b, provider);
      if (match.total < RECOMMEND_MIN_SCORE) continue;
      scored.push({
        participantId: b._id.toString(),
        companyName: b.companyName,
        location: b.location ?? "",
        industryType: b.industryType ?? "",
        alignmentScore: match.materialScore,
        engagementScore: match.locationScore,
        compositeScore: match.total,
        matchLabel: match.matchLabel,
        priority: match.priority,
        headline: match.matchLabel ?? "Relevant Match",
        _match: match,
      });
    }

    scored.sort((a, b) => b.compositeScore - a.compositeScore);
    const signals = await getProviderMatchSignals(userId);

    const nearYou = scored
      .filter((r) => isSameState(providerLoc, r._match.buyerLocation))
      .slice(0, 8)
      .map(({ _match, ...rest }) => rest);

    const otherStates = scored
      .filter(
        (r) =>
          r.alignmentScore > 0 &&
          isDifferentState(providerLoc, r._match.buyerLocation)
      )
      .slice(0, 8)
      .map(({ _match, ...rest }) => rest);

    if (nearYou.length) {
      sections.push({
        id: "buyers_near_you",
        title: "Buyers Near You",
        subtitle: signals.headlines.join(" · ") || "Category alignment in your state.",
        items: nearYou,
      });
    }
    if (otherStates.length) {
      sections.push({
        id: "buyers_other_states",
        title: "Buyers in Other States",
        subtitle: "Category-aligned buyers in other states.",
        items: otherStates,
      });
    }
  }

  return { sections };
}

/**
 * Intelligent feed ranking for opportunity controller.
 */
async function getRankedBuyerFeedItems(userId) {
  const suggestions = await getBuyerMaterialSuggestions(userId);
  const buyer = await User.findById(userId).lean();
  if (!buyer) return suggestions.items;

  const buyerLoc = resolveUserLocation(buyer);
  const enriched = [];

  for (const item of suggestions.items) {
    const m = await Material.findById(item.materialId)
      .populate(
        "provider",
        "companyName preferredMaterialCategories materialTypes state location country"
      )
      .lean();
    if (!m) {
      enriched.push({
        ...item,
        compositeScore: item.score ?? 0,
        relevanceScore: 0,
        activityScore: 0,
        freshnessScore: 0,
        matchLabel: item.matchLabel ?? getMatchLabel(item.score ?? 0),
      });
      continue;
    }
    const row = await enrichMaterialRow(m, buyer, {
      headline: item.headline,
    });
    enriched.push({
      ...row,
      sellerState: row.sellerState,
      sellerCity: row.sellerCity,
      sellerCountry: row.sellerCountry,
      country: row.country,
    });
  }

  enriched.sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0));

  if (!isIndiaCountry(buyerLoc.country)) {
    const inCountry = enriched.filter((r) =>
      isSameCountry(buyerLoc, {
        country: r.sellerCountry ?? r.country ?? "",
        state: r.sellerState ?? "",
        city: r.sellerCity ?? "",
      })
    );
    const other = enriched.filter(
      (r) => !inCountry.some((n) => n.materialId === r.materialId)
    );
    return [...inCountry, ...other].slice(0, 8);
  }

  const nearYou = enriched.filter((r) =>
    isSameState(buyerLoc, {
      state: r.sellerState ?? "",
      city: r.sellerCity ?? "",
      country: "IN",
    })
  );
  const other = enriched.filter(
    (r) =>
      !isSameState(buyerLoc, {
        state: r.sellerState ?? "",
        city: r.sellerCity ?? "",
        country: "IN",
      })
  );

  return [...nearYou, ...other].slice(0, 8);
}

module.exports = {
  getMaterialRecommendations,
  getParticipantRecommendations,
  getRankedBuyerFeedItems,
  enrichMaterialRow,
};
