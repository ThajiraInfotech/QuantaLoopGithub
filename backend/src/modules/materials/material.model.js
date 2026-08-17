const mongoose = require("mongoose");

const {
  MATERIAL_STATUS_VALUES,
  mapMaterialStatusForPublic,
} = require("./material-status.helper");

const AVAILABILITY = ["one_time", "daily", "weekly", "monthly"];
const STATUS = MATERIAL_STATUS_VALUES;
const VISIBILITY = ["network", "restricted"];
/** India-only vs visible to abroad buyers. Existing listings default india. */
const MARKET_SCOPE = ["india", "global"];

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    materialType: { type: String, required: true, trim: true, maxlength: 120 },
    materialSubtype: { type: String, default: "", trim: true, maxlength: 120 },
    materialForm: { type: String, default: "", trim: true, maxlength: 60 },
    cleanliness: { type: String, default: "", trim: true, maxlength: 60 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, maxlength: 60 },
    location: { type: String, required: true, trim: true, maxlength: 300 },
    country: {
      type: String,
      trim: true,
      default: "IN",
      maxlength: 8,
      uppercase: true,
      index: true,
    },
    marketScope: {
      type: String,
      enum: MARKET_SCOPE,
      default: "india",
      index: true,
    },
    availabilityFrequency: {
      type: String,
      required: true,
      enum: AVAILABILITY,
    },
    status: {
      type: String,
      enum: STATUS,
      default: "available",
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    industryType: { type: String, default: "", trim: true, maxlength: 120 },
    pickupAvailable: { type: Boolean, default: false },
    estimatedValueRange: { type: String, default: "", trim: true, maxlength: 200 },
    visibility: {
      type: String,
      enum: VISIBILITY,
      default: "network",
    },
    interestedBuyers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    imageUrls: {
      type: [{ type: String, trim: true, maxlength: 2048 }],
      default: [],
      validate: {
        validator: (urls) => Array.isArray(urls) && urls.length <= 3,
        message: "A material can have at most 3 images",
      },
    },
  },
  { timestamps: true }
);

materialSchema.index({ status: 1, visibility: 1 });
materialSchema.index({ provider: 1, updatedAt: -1 });
materialSchema.index({ country: 1, marketScope: 1, status: 1 });

function serializeProvider(doc) {
  if (!doc || !doc._id) return null;
  return {
    id: doc._id.toString(),
    companyName: doc.companyName ?? "",
    name: doc.name ?? "",
    email: doc.email ?? "",
    industryType: doc.industryType,
    location: doc.location,
  };
}

function toPublicMaterial(doc) {
  const m = doc.toObject ? doc.toObject({ virtuals: false }) : doc;
  const providerRaw = m.provider;
  const provider =
    providerRaw &&
    typeof providerRaw === "object" &&
    "_id" in providerRaw &&
    providerRaw._id
      ? serializeProvider(providerRaw)
      : {
          id:
            providerRaw?.toString?.() ??
            (providerRaw && providerRaw.toString()) ??
            "",
          companyName: "",
          name: "",
          email: "",
        };

  return {
    id: m._id.toString(),
    title: m.title,
    materialType: m.materialType,
    materialSubtype: m.materialSubtype ?? "",
    materialForm: m.materialForm ?? "",
    cleanliness: m.cleanliness ?? "",
    description: m.description,
    quantity: m.quantity,
    unit: m.unit,
    location: m.location,
    country: (m.country ?? "IN").toString().trim().toUpperCase() || "IN",
    marketScope: m.marketScope === "global" ? "global" : "india",
    availabilityFrequency: m.availabilityFrequency,
    status: mapMaterialStatusForPublic(m.status),
    provider,
    industryType: m.industryType,
    pickupAvailable: m.pickupAvailable,
    estimatedValueRange: m.estimatedValueRange,
    visibility: m.visibility,
    interestedBuyerIds: (m.interestedBuyers ?? []).map((id) =>
      id?.toString?.() ?? String(id)
    ),
    imageUrls: Array.isArray(m.imageUrls) ? m.imageUrls : [],
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

const Material = mongoose.model("Material", materialSchema);

module.exports = {
  Material,
  AVAILABILITY,
  STATUS,
  VISIBILITY,
  MARKET_SCOPE,
  toPublicMaterial,
};
