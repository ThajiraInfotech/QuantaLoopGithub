const mongoose = require("mongoose");

const STATUSES = ["draft", "published", "archived"];
const LANGUAGES = ["en", "hi", "ta"];

const sectionSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true, trim: true, maxlength: 200 },
    paragraphs: {
      type: [String],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 1;
        },
        message: "Each section needs at least one paragraph",
      },
    },
  },
  { _id: false }
);

const contentInsightSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
      unique: true,
      index: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 320 },
    excerpt: { type: String, default: "", trim: true, maxlength: 400 },
    status: {
      type: String,
      enum: STATUSES,
      default: "draft",
      index: true,
    },
    language: {
      type: String,
      enum: LANGUAGES,
      default: "en",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    sections: {
      type: [sectionSchema],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 1;
        },
        message: "At least one section is required",
      },
    },
    readingMinutes: { type: Number, default: 5, min: 1, max: 60 },
    publishedAt: { type: Date, default: null, index: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

contentInsightSchema.index({ status: 1, publishedAt: -1 });
contentInsightSchema.index({ title: "text", description: "text", tags: "text" });

function toPublicInsight(doc) {
  const o =
    doc && typeof doc === "object" && typeof doc.toObject === "function"
      ? doc.toObject()
      : doc;
  return {
    id: o._id.toString(),
    title: o.title,
    slug: o.slug,
    description: o.description,
    excerpt: o.excerpt || o.description,
    status: o.status,
    language: o.language,
    tags: o.tags ?? [],
    sections: (o.sections ?? []).map((section) => ({
      heading: section.heading,
      paragraphs: section.paragraphs ?? [],
    })),
    readingMinutes: o.readingMinutes ?? 5,
    publishedAt: o.publishedAt ? new Date(o.publishedAt).toISOString() : null,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
    updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : null,
  };
}

const ContentInsight =
  mongoose.models.ContentInsight ||
  mongoose.model("ContentInsight", contentInsightSchema);

module.exports = {
  ContentInsight,
  STATUSES,
  LANGUAGES,
  toPublicInsight,
};
