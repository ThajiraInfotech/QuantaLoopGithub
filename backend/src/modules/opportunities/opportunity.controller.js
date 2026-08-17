const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");
const { Material } = require("../materials/material.model");
const { getProviderMatchSignals } = require("../matches/match.service");
const {
  getRankedBuyerFeedItems,
  enrichMaterialRow,
} = require("../recommendations/recommendation.service");
const { User } = require("../users/user.model");
const { SavedMaterial } = require("../saved-materials/saved-material.model");
const { resolveUserLocation, isSameState, isSameCountry } = require("../../utils/locationMatch");
const { RECOMMEND_MIN_SCORE } = require("../matches/mvp-match.service");
const {
  isIndiaCountry,
  isOutsideIndiaListing,
  isInternationallyVisible,
} = require("../../utils/marketScope");

const listable = ["available", "active", "in_discussion"];

async function computeResponseMetrics(userId) {
  const { Interest } = require("../interests/interest.model");
  const uid = new mongoose.Types.ObjectId(userId);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const interests = await Interest.find({
    provider: uid,
    status: { $ne: "pending" },
    createdAt: { $gte: since },
  })
    .select("createdAt updatedAt status")
    .lean();

  let responded = 0;
  let totalHours = 0;
  for (const row of interests) {
    const ms = new Date(row.updatedAt) - new Date(row.createdAt);
    if (ms >= 0 && ms < 14 * 24 * 60 * 60 * 1000) {
      responded += 1;
      totalHours += ms / (1000 * 60 * 60);
    }
  }

  const avgHours = responded ? totalHours / responded : null;
  const responseRatePct =
    interests.length > 0
      ? Math.round((responded / interests.length) * 100)
      : null;

  const outbound = await Interest.countDocuments({
    buyer: uid,
    createdAt: { $gte: since },
  });

  const engagementScore = Math.min(100, responded * 12 + outbound * 6);
  const hasHistory = interests.length > 0 && responded > 0;

  return {
    windowDays: 30,
    averageResponseHours: avgHours != null ? Math.round(avgHours * 10) / 10 : null,
    activeResponseRatePct: responseRatePct,
    recentEngagementScore: engagementScore,
    hasHistory,
    respondedCount: responded,
    interestCount: interests.length,
  };
}

const getOpportunityFeed = asyncHandler(async (req, res) => {
  const { role, id: userId } = req.user;
  const sections = [];

  if (role === "verified_buyer") {
    const [rankedRelevant, recent, savedCount, buyer] = await Promise.all([
      getRankedBuyerFeedItems(userId),
      Material.find({
        status: { $in: listable },
        visibility: "network",
        provider: { $ne: new mongoose.Types.ObjectId(userId) },
      })
        .sort({ updatedAt: -1 })
        .limit(12)
        .populate(
          "provider",
          "companyName preferredMaterialCategories materialTypes state location country"
        )
        .lean(),
      SavedMaterial.countDocuments({ buyer: userId }),
      User.findById(userId).lean(),
    ]);

    const buyerLoc = buyer
      ? resolveUserLocation(buyer)
      : { country: "IN", state: "", city: "" };
    const recentEnriched = [];
    if (buyer) {
      for (const m of recent) {
        if (!isIndiaCountry(buyerLoc.country) && !isInternationallyVisible(m)) {
          continue;
        }
        const row = await enrichMaterialRow(m, buyer, {
          headline: "Recently active listing",
        });
        if ((row.compositeScore ?? 0) >= RECOMMEND_MIN_SCORE) {
          recentEnriched.push(row);
        }
      }
    }

    if (!isIndiaCountry(buyerLoc.country)) {
      const inCountry = rankedRelevant
        .filter((r) =>
          isSameCountry(buyerLoc, {
            country: r.sellerCountry ?? r.country ?? "",
            state: r.sellerState ?? "",
            city: r.sellerCity ?? "",
          })
        )
        .slice(0, 6);

      sections.push({
        id: "materials_in_your_country",
        title: "Materials in your country",
        subtitle: "Category alignment in your country — no city proximity.",
        items: inCountry.length ? inCountry : rankedRelevant.slice(0, 6),
      });
    } else {
      const indiaRelevant = rankedRelevant.filter(
        (r) => !isOutsideIndiaListing({ country: r.sellerCountry ?? r.country })
      );

      const nearYou = indiaRelevant
        .filter((r) =>
          buyerLoc.state
            ? isSameState(buyerLoc, {
                state: r.sellerState ?? "",
                city: r.sellerCity ?? "",
                country: "IN",
              })
            : false
        )
        .slice(0, 6);

      const otherStates = indiaRelevant
        .filter((r) => !nearYou.some((n) => n.materialId === r.materialId))
        .slice(0, 6);

      const globalItems = rankedRelevant
        .filter((r) =>
          isOutsideIndiaListing({ country: r.sellerCountry ?? r.country })
        )
        .slice(0, 6);

      sections.push({
        id: "materials_near_you",
        title: "Materials Near You",
        subtitle:
          "Category and state alignment — prioritized by match score.",
        items: nearYou.length ? nearYou : indiaRelevant.slice(0, 6),
      });

      sections.push({
        id: "materials_other_states",
        title: "Materials in Other States",
        subtitle: "Same material category — interstate opportunities.",
        items: otherStates,
      });

      sections.push({
        id: "materials_global",
        title: "Global materials",
        subtitle: "Materials listed outside India.",
        items: globalItems,
      });
    }

    sections.push({
      id: "new_recovery",
      title: "New recovery opportunities",
      subtitle: "Recently updated listings on the network.",
      items: recentEnriched
        .sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0))
        .slice(0, 6),
    });

    sections.push({
      id: "saved",
      title: "Saved opportunities",
      subtitle: `${savedCount} item${savedCount === 1 ? "" : "s"} on your watch list.`,
      items: [],
    });
  }

  if (role === "material_provider") {
    const [signals, metrics, activeNear, provider] = await Promise.all([
      getProviderMatchSignals(userId),
      computeResponseMetrics(userId),
      Material.find({
        provider: userId,
        status: { $in: listable },
      })
        .sort({ updatedAt: -1 })
        .limit(4)
        .lean(),
      User.findById(userId).lean(),
    ]);

    const providerLoc = provider ? resolveUserLocation(provider) : { state: "", city: "" };

    sections.push({
      id: "response_posture",
      title: "Response posture",
      subtitle: "Operational responsiveness signals for your desk.",
      metrics,
    });

    const nearBuyers = signals.buyers
      .filter((b) =>
        providerLoc.state
          ? isSameState(providerLoc, {
              state: b.state ?? "",
              city: b.city ?? "",
            })
          : false
      )
      .slice(0, 6);
    const otherBuyers = signals.buyers
      .filter((b) => !nearBuyers.some((n) => n.buyerId === b.buyerId))
      .slice(0, 6);

    sections.push({
      id: "buyers_near_you",
      title: "Buyers Near You",
      subtitle: signals.headlines.join(" · ") || "Category alignment in your state.",
      items: (nearBuyers.length ? nearBuyers : signals.buyers.slice(0, 6)).map(
        (b) => ({
          companyName: b.companyName,
          location: b.location,
          score: b.score ?? b.matchPercent,
          matchLabel: b.matchLabel,
          headline: b.matchLabel ?? "Relevant Match",
        })
      ),
    });

    sections.push({
      id: "buyers_other_states",
      title: "Buyers in Other States",
      subtitle: "Category-aligned buyers in other states.",
      items: otherBuyers.map((b) => ({
        companyName: b.companyName,
        location: b.location,
        score: b.score ?? b.matchPercent,
        matchLabel: b.matchLabel,
        headline: b.matchLabel ?? "Relevant Match",
      })),
    });

    sections.push({
      id: "recent_active_near_you",
      title: "Recently active near you",
      subtitle: "Your own listings by last operational update.",
      items: activeNear.map((m) => ({
        materialId: m._id.toString(),
        title: m.title,
        materialType: m.materialType,
        location: m.location,
        headline: "Your published availability",
      })),
    });
  }

  if (role === "admin") {
    const { Interest } = require("../interests/interest.model");
    const openInterests = await Interest.countDocuments({ status: "pending" });
    const activeListings = await Material.countDocuments({
      status: { $in: listable },
    });
    sections.push({
      id: "network_pulse",
      title: "Network pulse",
      subtitle: "Operational volume snapshot.",
      items: [
        { headline: "Pending interests", value: openInterests },
        { headline: "Active listings", value: activeListings },
      ],
    });
  }

  sendSuccess(res, { sections }, "Opportunity feed retrieved");
});

const getOpportunityMetrics = asyncHandler(async (req, res) => {
  const metrics = await computeResponseMetrics(req.user.id);
  sendSuccess(res, { metrics }, "Metrics retrieved");
});

module.exports = { getOpportunityFeed, getOpportunityMetrics, computeResponseMetrics };
