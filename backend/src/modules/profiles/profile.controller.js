const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const { computeProfileCompletion } = require("../../utils/profileCompletion");
const { User, toPublicJSON } = require("../users/user.model");
const { computeTrustSignals } = require("./profile.service");
const { safeParsePatch } = require("./profile.validation");
const { applyIndustryProfilePatch } = require("../../utils/industryProfile");
const { normalizeCategoryList } = require("../../utils/materialCategories");

function validationError(next, flatten) {
  next(new AppError("Validation failed", 400, "VALIDATION_ERROR", flatten));
}

function applyProfilePatch(user, data) {
  const assign = [
    "name",
    "companyName",
    "companyDescription",
    "website",
    "operationalLocation",
    "location",
    "country",
    "stateCode",
    "state",
    "region",
    "customRegion",
    "employeeRange",
    "establishedYear",
    "responseRate",
    "averageResponseTime",
  ];
  for (const key of assign) {
    if (data[key] !== undefined) user[key] = data[key];
  }
  applyIndustryProfilePatch(user, data);
  if (data.city !== undefined) {
    user.location = String(data.city).trim();
  }
  if (data.country !== undefined) {
    user.country = String(data.country).trim().toUpperCase() || "IN";
  }
  if (data.materialsHandled !== undefined) {
    user.materialTypes = normalizeCategoryList(data.materialsHandled);
  }
  if (data.materialTypes !== undefined) {
    user.materialTypes = normalizeCategoryList(data.materialTypes);
  }
  if (data.preferredMaterialCategories !== undefined) {
    const categories = normalizeCategoryList(data.preferredMaterialCategories);
    user.preferredMaterialCategories = categories;
    if (user.role === "material_provider") {
      user.materialTypes = categories;
    }
  }
  if (data.requiredMaterialCategories !== undefined) {
    const categories = normalizeCategoryList(data.requiredMaterialCategories);
    user.requiredMaterialCategories = categories;
    if (user.role === "verified_buyer") {
      user.materialTypes = categories;
    }
  }
  if (data.state !== undefined) {
    user.state = String(data.state).trim();
  }
  user.profileCompletion = computeProfileCompletion(user);
}

const getMyProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    next(new AppError("User not found", 404, "NOT_FOUND"));
    return;
  }

  const trustSignals = await computeTrustSignals(req.user.id);
  sendSuccess(
    res,
    { profile: toPublicJSON(user), trustSignals },
    "Profile retrieved"
  );
});

const patchMyProfile = asyncHandler(async (req, res, next) => {
  const parsed = safeParsePatch(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    next(new AppError("User not found", 404, "NOT_FOUND"));
    return;
  }

  applyProfilePatch(user, parsed.data);
  await user.save();

  const trustSignals = await computeTrustSignals(req.user.id);
  sendSuccess(res, { profile: toPublicJSON(user), trustSignals }, "Profile updated");
});

const getProfileById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid profile id", 400, "INVALID_ID"));
    return;
  }

  const isSelf = req.user.id === id;
  const isAdmin = req.user.role === "admin";
  const query = User.findById(id).select("-password");
  if (!isSelf && !isAdmin) {
    query.select("-email");
  }
  const user = await query.exec();
  if (!user) {
    next(new AppError("Profile not found", 404, "NOT_FOUND"));
    return;
  }
  const publicDoc = toPublicJSON(user, { includeEmail: isSelf || isAdmin });
  const trustSignals = await computeTrustSignals(id);

  sendSuccess(
    res,
    { profile: publicDoc, trustSignals },
    "Profile retrieved"
  );
});

module.exports = { getMyProfile, patchMyProfile, getProfileById };
