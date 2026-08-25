const mongoose = require("mongoose");

const { AppError } = require("../../utils/AppError");
const { Interest } = require("../interests/interest.model");
const { Material } = require("../materials/material.model");
const { User } = require("../users/user.model");
const { paidParticipantFilter } = require("../subscriptions/paid-participants");
const { createNotification } = require("../notifications/notification.service");
const { introductionRequest } = require("../../utils/notificationCopy");
const { IntroductionRequest } = require("./introduction.model");

const INTRO_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

async function getNetworkOverview() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const participantFilter = await paidParticipantFilter();
  const [registeredUsers, activeMaterials, recentInterests, sample] =
    await Promise.all([
      User.countDocuments(participantFilter),
      Material.countDocuments({
        status: { $in: ["available", "active", "in_discussion"] },
      }),
      Interest.countDocuments({ createdAt: { $gte: since } }),
      User.find(participantFilter)
        .select("companyName role")
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean(),
    ]);

  return {
    registeredParticipants: registeredUsers,
    verifiedParticipants: registeredUsers,
    activeMaterials,
    recentOpportunityActivity: recentInterests,
    spotlight: sample.map((u) => ({
      companyName: u.companyName,
      role: u.role,
    })),
  };
}

async function createIntroductionRequest(providerId, buyerId, payload = {}) {
  const providerOid = new mongoose.Types.ObjectId(providerId);
  const buyerOid = new mongoose.Types.ObjectId(buyerId);

  const [provider, buyer] = await Promise.all([
    User.findById(providerOid).select("companyName name role"),
    User.findById(buyerOid).select("companyName role"),
  ]);

  if (!provider || provider.role !== "material_provider") {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
  if (!buyer || buyer.role !== "verified_buyer") {
    throw new AppError("Buyer not found", 404, "BUYER_NOT_FOUND");
  }

  const since = new Date(Date.now() - INTRO_COOLDOWN_MS);
  const recent = await IntroductionRequest.findOne({
    provider: providerOid,
    buyer: buyerOid,
    createdAt: { $gte: since },
  }).lean();

  if (recent) {
    throw new AppError(
      "You already requested an introduction to this buyer recently",
      409,
      "INTRODUCTION_RECENT"
    );
  }

  let relatedMaterial = null;
  if (payload.materialId) {
    if (!mongoose.Types.ObjectId.isValid(payload.materialId)) {
      throw new AppError("Invalid material id", 400, "INVALID_ID");
    }
    const material = await Material.findById(payload.materialId).lean();
    if (!material || material.provider.toString() !== providerId) {
      throw new AppError("Material not found", 404, "NOT_FOUND");
    }
    relatedMaterial = material._id;
  }

  const message =
    (payload.message ?? "").trim() ||
    `${provider.companyName} would like to coordinate on material recovery opportunities.`;

  const intro = await IntroductionRequest.create({
    provider: providerOid,
    buyer: buyerOid,
    message,
    relatedMaterial,
  });

  const introCopy = introductionRequest({
    providerCompany: provider.companyName,
    message,
  });
  await createNotification({
    recipient: buyerOid,
    type: "introduction_request",
    title: introCopy.title,
    message: introCopy.message,
    relatedMaterial,
    relatedInterest: null,
  });

  return {
    id: intro._id.toString(),
    buyerId: buyerOid.toString(),
    createdAt: intro.createdAt,
  };
}

module.exports = { getNetworkOverview, createIntroductionRequest };
