const mongoose = require("mongoose");

const USER_ROLES = ["material_provider", "verified_buyer", "admin"];
const VERIFICATION_STATUS = ["unverified", "pending", "verified"];
const ACCOUNT_STATUS = ["active", "suspended"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: { type: String, trim: true, sparse: true, unique: true },
    hasLocalPassword: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: true },
    googleEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false, default: null },
    emailVerificationExpiresAt: { type: Date, select: false, default: null },
    passwordResetToken: { type: String, select: false, default: null },
    passwordResetExpiresAt: { type: Date, select: false, default: null },
    /** Pending admin password change (OTP-confirmed). */
    pendingPasswordHash: { type: String, select: false, default: null },
    passwordChangeToken: { type: String, select: false, default: null },
    passwordChangeExpiresAt: { type: Date, select: false, default: null },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: "material_provider",
    },
    industryType: { type: String, trim: true, default: "" },
    secondaryIndustries: [{ type: String, trim: true }],
    customIndustry: { type: String, trim: true, default: "", maxlength: 120 },
    materialTypes: [{ type: String, trim: true }],
    preferredMaterialCategories: [{ type: String, trim: true }],
    requiredMaterialCategories: [{ type: String, trim: true }],
    industriesHandled: [{ type: String, trim: true }],
    location: { type: String, trim: true, default: "" },
    /** ISO country code. Existing users default to India (additive intl). */
    country: { type: String, trim: true, default: "IN", maxlength: 8, uppercase: true },
    stateCode: { type: String, trim: true, default: "", maxlength: 8 },
    state: { type: String, trim: true, default: "", maxlength: 80 },
    region: { type: String, trim: true, default: "", maxlength: 120 },
    customRegion: { type: String, trim: true, default: "", maxlength: 120 },
    companyDescription: { type: String, default: "", trim: true, maxlength: 8000 },
    website: { type: String, default: "", trim: true, maxlength: 500 },
    operationalLocation: { type: String, default: "", trim: true, maxlength: 300 },
    employeeRange: { type: String, default: "", trim: true, maxlength: 80 },
    establishedYear: { type: Number, min: 1800, max: 2100 },
    responseRate: { type: Number, min: 0, max: 100, default: 0 },
    averageResponseTime: { type: String, default: "", trim: true, maxlength: 120 },
    profileCompletion: { type: Number, min: 0, max: 100, default: 0 },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUS,
      default: "unverified",
      index: true,
    },
    isVerified: { type: Boolean, default: false },
    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUS,
      default: "active",
      index: true,
    },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    jobTitle: { type: String, default: "", trim: true, maxlength: 120 },
    loginCount: { type: Number, default: 0, min: 0 },
    lastLoginAt: { type: Date, default: null },
    /** 30-day free trial — started once after onboarding; never restarts. */
    trialStartedAt: { type: Date, default: null },
    trialEndsAt: { type: Date, default: null, index: true },
    trialConsumed: { type: Boolean, default: false, index: true },
    /** Legal consent at registration — admin proof only (not exposed to members). */
    termsAcceptedAt: { type: Date, default: null },
    termsVersion: { type: String, trim: true, default: null, maxlength: 40 },
  },
  { timestamps: true }
);

userSchema.pre("save", function syncVerifiedFlag() {
  this.isVerified = this.verificationStatus === "verified";
});

const { computeProfileCompletion } = require("../../utils/profileCompletion");
const { normalizeVerificationStatus } = require("../../utils/verificationDisplay");

function toPublicJSON(doc, options = {}) {
  const includeEmail = options.includeEmail !== false;
  const m = doc.toObject ? doc.toObject() : doc;
  const completion = computeProfileCompletion(m);

  const base = {
    id: m._id.toString(),
    name: m.name,
    companyName: m.companyName,
    role: m.role,
    industryType: m.industryType ?? "",
    primaryIndustry: m.industryType ?? "",
    secondaryIndustries: m.secondaryIndustries ?? [],
    customIndustry: m.customIndustry ?? "",
    materialTypes: m.materialTypes ?? [],
    preferredMaterialCategories: m.preferredMaterialCategories ?? [],
    requiredMaterialCategories: m.requiredMaterialCategories ?? [],
    industriesHandled: m.industriesHandled ?? [],
    location: m.location ?? "",
    country: (m.country ?? "IN").toString().trim().toUpperCase() || "IN",
    stateCode: m.stateCode ?? "",
    state: m.state ?? "",
    region: m.region ?? "",
    customRegion: m.customRegion ?? "",
    city: m.location ?? "",
    companyDescription: m.companyDescription ?? "",
    website: m.website ?? "",
    operationalLocation: m.operationalLocation ?? "",
    employeeRange: m.employeeRange ?? "",
    establishedYear: m.establishedYear ?? null,
    responseRate: typeof m.responseRate === "number" ? m.responseRate : 0,
    averageResponseTime: m.averageResponseTime ?? "",
    profileCompletion: completion,
    verificationStatus: normalizeVerificationStatus(m.verificationStatus),
    isVerified: normalizeVerificationStatus(m.verificationStatus) === "verified",
    accountStatus: m.accountStatus ?? "active",
    emailVerified: m.emailVerified !== false,
    googleEmailVerified: Boolean(m.googleEmailVerified),
    hasLocalPassword: m.hasLocalPassword ?? true,
    authProvider: m.authProvider ?? "local",
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };

  if (includeEmail) {
    return { ...base, email: m.email };
  }
  return base;
}

const User = mongoose.model("User", userSchema);

module.exports = {
  User,
  USER_ROLES,
  VERIFICATION_STATUS,
  ACCOUNT_STATUS,
  toPublicJSON,
};
