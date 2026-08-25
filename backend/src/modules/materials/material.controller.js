const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const { notifyBuyersOfNewMaterial } = require("../matches/match.service");
const { User } = require("../users/user.model");
const { Conversation } = require("../conversations/conversation.model");
const { Interest } = require("../interests/interest.model");
const { Message } = require("../messages/message.model");
const { Notification } = require("../notifications/notification.model");
const { IntroductionRequest } = require("../network/introduction.model");
const { Reminder } = require("../reminders/reminder.model");
const { Report } = require("../reports/report.model");
const { SavedMaterial } = require("../saved-materials/saved-material.model");
const { TimelineEvent } = require("../timeline/timeline.model");
const { Material, toPublicMaterial } = require("./material.model");
const { normalizeCategory } = require("../../utils/materialCategories");
const { isListedForNetworkBrowse } = require("./material-status.helper");
const { listForMaterial } = require("../timeline/timeline.service");
const { safeParseCreate, safeParseUpdate } = require("./material.validation");
const {
  sanitizeImageUrls,
  uploadMaterialImage,
} = require("../../services/storage/material-image.service");
const {
  normalizeCountryCode,
  isIndiaCountry,
  isInternationallyVisible,
} = require("../../utils/marketScope");

function validationError(next, flatten) {
  next(
    new AppError("Validation failed", 400, "VALIDATION_ERROR", flatten)
  );
}

function resolveProviderIdForCreate(req, data) {
  if (req.user.role === "admin") {
    if (data.providerUserId) {
      return data.providerUserId;
    }
    return req.user.id;
  }
  return req.user.id;
}

/** Align listing location/type/market with onboarding profile for MVP matching. */
async function applyProviderListingDefaults(providerId, data) {
  const provider = await User.findById(providerId)
    .select("state city location country preferredMaterialCategories materialTypes")
    .lean();
  if (!provider) return { ...data };

  const payload = { ...data };
  payload.materialType =
    normalizeCategory(payload.materialType) || payload.materialType;

  const providerCountry = normalizeCountryCode(provider.country);
  payload.country = normalizeCountryCode(payload.country || providerCountry);

  if (!isIndiaCountry(providerCountry)) {
    // Abroad sellers: country-only listing, always internationally visible.
    payload.marketScope = "global";
    const countryLabel = payload.country;
    if (!(payload.location ?? "").toString().trim()) {
      payload.location = countryLabel;
    }
    return payload;
  }

  // Indian sellers keep city/state proximity; marketScope india|global from form.
  payload.marketScope =
    payload.marketScope === "global" ? "global" : "india";

  const city = (provider.city ?? provider.location ?? "").trim();
  const state = (provider.state ?? "").trim();
  const loc = (payload.location ?? "").trim();

  if (loc && state && !loc.includes(",")) {
    payload.location = `${loc}, ${state}`;
  } else if (!loc && city && state) {
    payload.location = `${city}, ${state}`;
  }

  return payload;
}

function applySanitizedImageUrls(data, env) {
  if (!Object.prototype.hasOwnProperty.call(data, "imageUrls")) {
    return data;
  }
  return {
    ...data,
    imageUrls: sanitizeImageUrls(data.imageUrls ?? [], env),
  };
}

const listMaterials = asyncHandler(async (req, res, next) => {
  const { role, id: userId } = req.user;
  let query = Material.find();
  let buyerCountry = "IN";

  if (role === "material_provider") {
    query = query.where({ provider: userId });
  } else if (role === "verified_buyer") {
    const buyer = await User.findById(userId).select("country").lean();
    buyerCountry = normalizeCountryCode(buyer?.country);

    query = query.where({
      status: { $in: ["available", "active", "in_discussion"] },
      visibility: "network",
      provider: { $ne: new mongoose.Types.ObjectId(userId) },
    });

    // Abroad buyers only see internationally visible listings (preserve India-only exclusivity).
    if (!isIndiaCountry(buyerCountry)) {
      query = query.where({
        $or: [
          { marketScope: "global" },
          { country: { $exists: true, $nin: ["IN", "in", ""] } },
        ],
      });
    }
  }

  const docs = await query
    .sort({ updatedAt: -1 })
    .populate("provider", "companyName name email country")
    .limit(200)
    .exec();

  let items = docs.map((d) => toPublicMaterial(d));
  if (role === "verified_buyer" && !isIndiaCountry(buyerCountry)) {
    items = items.filter((m) => isInternationallyVisible(m));
  }

  sendSuccess(res, { items }, "Materials retrieved");
});

const getMaterialById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid material id", 400, "INVALID_ID"));
    return;
  }

  const doc = await Material.findById(id).populate(
    "provider",
    "companyName name email industryType location"
  );

  if (!doc) {
    next(new AppError("Material not found", 404, "NOT_FOUND"));
    return;
  }

  const { role, id: userId } = req.user;
  const providerId = doc.provider?._id?.toString?.() ?? doc.provider?.toString();

  if (role === "material_provider" && providerId !== userId) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  if (role === "verified_buyer") {
    const buyerId = new mongoose.Types.ObjectId(userId);
    const isInterested = (doc.interestedBuyers ?? []).some((bid) =>
      bid.equals(buyerId)
    );
    const listed = isListedForNetworkBrowse(doc.status);
    const canViewNetwork =
      listed &&
      doc.visibility === "network" &&
      providerId !== userId;
    const canViewRestricted =
      listed &&
      doc.visibility === "restricted" &&
      isInterested;

    if (!canViewNetwork && !canViewRestricted) {
      next(new AppError("Forbidden", 403, "FORBIDDEN"));
      return;
    }
  }

  sendSuccess(res, { material: toPublicMaterial(doc) }, "Material retrieved");
});

const getMaterialTimeline = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid material id", 400, "INVALID_ID"));
    return;
  }

  const doc = await Material.findById(id).populate(
    "provider",
    "companyName name email industryType location"
  );

  if (!doc) {
    next(new AppError("Material not found", 404, "NOT_FOUND"));
    return;
  }

  const { role, id: userId } = req.user;
  const providerId = doc.provider?._id?.toString?.() ?? doc.provider?.toString();

  if (role === "material_provider" && providerId !== userId) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  if (role === "verified_buyer") {
    const buyerId = new mongoose.Types.ObjectId(userId);
    const isInterested = (doc.interestedBuyers ?? []).some((bid) =>
      bid.equals(buyerId)
    );
    const listed = isListedForNetworkBrowse(doc.status);
    const canViewNetwork =
      listed &&
      doc.visibility === "network" &&
      providerId !== userId;
    const canViewRestricted =
      listed &&
      doc.visibility === "restricted" &&
      isInterested;

    if (!canViewNetwork && !canViewRestricted) {
      next(new AppError("Forbidden", 403, "FORBIDDEN"));
      return;
    }
  }

  const items = await listForMaterial(id, 50);
  sendSuccess(res, { items }, "Timeline retrieved");
});

const createMaterial = asyncHandler(async (req, res, next) => {
  const parsed = safeParseCreate(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const data = applySanitizedImageUrls(parsed.data, req.app.locals.env);
  const providerId = resolveProviderIdForCreate(req, data);

  if (req.user.role === "admin" && data.providerUserId) {
    const target = await User.findById(providerId).select("role");
    if (!target) {
      next(new AppError("Provider user not found", 404, "USER_NOT_FOUND"));
      return;
    }
    if (target.role !== "material_provider") {
      next(
        new AppError(
          "Materials can only be assigned to material providers",
          400,
          "INVALID_PROVIDER_ROLE"
        )
      );
      return;
    }
  }

  const payload = { ...data };
  delete payload.providerUserId;

  const enriched = await applyProviderListingDefaults(providerId, payload);

  const material = await Material.create({
    ...enriched,
    provider: providerId,
  });

  const populated = await Material.findById(material._id).populate(
    "provider",
    "companyName name email preferredMaterialCategories materialTypes state location country"
  );

  try {
    await notifyBuyersOfNewMaterial(populated);
  } catch {
    /* Matching notifications are best-effort and must not block publish */
  }

  sendSuccess(
    res,
    { material: toPublicMaterial(populated) },
    "Material is now visible on the network",
    201
  );
});

const updateMaterial = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid material id", 400, "INVALID_ID"));
    return;
  }

  const parsed = safeParseUpdate(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const data = applySanitizedImageUrls(parsed.data, req.app.locals.env);

  const doc = await Material.findById(id);
  if (!doc) {
    next(new AppError("Material not found", 404, "NOT_FOUND"));
    return;
  }

  const providerId = doc.provider.toString();
  if (req.user.role === "material_provider" && providerId !== req.user.id) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  Object.assign(doc, data);
  await doc.save();

  const populated = await Material.findById(doc._id).populate(
    "provider",
    "companyName name email"
  );

  sendSuccess(res, { material: toPublicMaterial(populated) }, "Material updated");
});

async function deleteRelatedMaterialRecords(materialId) {
  const mid = new mongoose.Types.ObjectId(materialId);
  const [conversations, interests] = await Promise.all([
    Conversation.find({ material: mid }).select("_id").lean(),
    Interest.find({ material: mid }).select("_id").lean(),
  ]);
  const conversationIds = conversations.map((c) => c._id);
  const interestIds = interests.map((i) => i._id);

  await Promise.all([
    conversationIds.length
      ? Message.deleteMany({ conversation: { $in: conversationIds } })
      : Promise.resolve(),
    Conversation.deleteMany({ material: mid }),
    Interest.deleteMany({ material: mid }),
    SavedMaterial.deleteMany({ material: mid }),
    TimelineEvent.deleteMany({
      $or: [
        { material: mid },
        ...(interestIds.length ? [{ interest: { $in: interestIds } }] : []),
      ],
    }),
    Reminder.deleteMany({ relatedMaterial: mid }),
    Notification.deleteMany({
      $or: [
        { relatedMaterial: mid },
        ...(interestIds.length
          ? [{ relatedInterest: { $in: interestIds } }]
          : []),
      ],
    }),
    IntroductionRequest.deleteMany({ relatedMaterial: mid }),
    Report.deleteMany({ targetMaterial: mid }),
  ]);
}

const deleteMaterial = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid material id", 400, "INVALID_ID"));
    return;
  }

  const doc = await Material.findById(id);
  if (!doc) {
    next(new AppError("Material not found", 404, "NOT_FOUND"));
    return;
  }

  const providerId = doc.provider.toString();
  if (req.user.role === "material_provider" && providerId !== req.user.id) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  await deleteRelatedMaterialRecords(id);
  await Material.deleteOne({ _id: doc._id });

  sendSuccess(res, { id }, "Material removed");
});

const uploadMaterialImageHandler = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    next(new AppError("Image file is required", 400, "IMAGE_REQUIRED"));
    return;
  }

  try {
    const url = await uploadMaterialImage(req.file, req.app.locals.env);
    sendSuccess(res, { url }, "Image uploaded");
  } catch (err) {
    next(
      new AppError(
        err.message || "Unable to upload image",
        500,
        "UPLOAD_FAILED"
      )
    );
  }
});

module.exports = {
  listMaterials,
  getMaterialById,
  getMaterialTimeline,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  uploadMaterialImageHandler,
};
