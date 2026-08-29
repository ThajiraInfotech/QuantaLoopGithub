const mongoose = require("mongoose");

const SUPPORT_CATEGORIES = [
  "onboarding",
  "matching",
  "billing",
  "technical",
  "other",
];

const SUPPORT_SOURCES = ["public", "onboarding", "dashboard"];

const SUPPORT_REQUEST_STATUS = ["open", "resolved"];

const supportRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, maxlength: 254 },
    category: { type: String, enum: SUPPORT_CATEGORIES, required: true },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    companyName: { type: String, default: "", trim: true, maxlength: 200 },
    source: { type: String, enum: SUPPORT_SOURCES, default: "public" },
    pageUrl: { type: String, default: "", trim: true, maxlength: 500 },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: SUPPORT_REQUEST_STATUS,
      default: "open",
      index: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

supportRequestSchema.index({ status: 1, createdAt: -1 });
supportRequestSchema.index({ email: 1, createdAt: -1 });

function formatSupportRefId(id) {
  return `SUP-${id.toString().slice(-8).toUpperCase()}`;
}

function toPublicSupportRequest(doc) {
  const o =
    doc && typeof doc === "object" && typeof doc.toObject === "function"
      ? doc.toObject()
      : doc;
  const id = o._id.toString();
  return {
    id,
    supportRefId: formatSupportRefId(o._id),
    name: o.name,
    email: o.email,
    category: o.category,
    description: o.description,
    companyName: o.companyName ?? "",
    source: o.source,
    pageUrl: o.pageUrl ?? "",
    userId: o.user?.toString?.() ?? null,
    status: o.status,
    resolvedBy: o.resolvedBy?.toString?.() ?? null,
    resolvedAt: o.resolvedAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const SupportRequest = mongoose.model("SupportRequest", supportRequestSchema);

module.exports = {
  SupportRequest,
  SUPPORT_CATEGORIES,
  SUPPORT_SOURCES,
  SUPPORT_REQUEST_STATUS,
  formatSupportRefId,
  toPublicSupportRequest,
};
