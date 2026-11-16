const mongoose = require("mongoose");

const { AppError } = require("../../utils/AppError");
const {
  ContentInsight,
  toPublicInsight,
} = require("./content-insight.model");
const { SEED_ARTICLES } = require("./content-insight.seed");

const SEED_MARKER_KEY = "content-insights-v1";

const seedMarkerSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    seededAt: { type: Date, default: Date.now },
  },
  { collection: "content_insight_seed_markers" }
);

const ContentInsightSeedMarker =
  mongoose.models.ContentInsightSeedMarker ||
  mongoose.model("ContentInsightSeedMarker", seedMarkerSchema);

function estimateReadingMinutes(sections) {
  const text = (sections ?? [])
    .flatMap((section) => [section.heading, ...(section.paragraphs ?? [])])
    .join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.min(60, Math.ceil(words / 200)));
}

function normalizeTags(tags) {
  const seen = new Set();
  const out = [];
  for (const raw of tags ?? []) {
    const tag = String(raw ?? "").trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

function resolvePublishedAt(status, publishedAt) {
  if (status !== "published") return null;
  if (publishedAt) {
    const date = new Date(publishedAt);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}

/**
 * Marks content-insights as initialized.
 * Never re-inserts starter articles when the collection is empty —
 * otherwise admin deletes appear to "come back".
 * Use seedContentInsights() (script) for an intentional first-time seed.
 */
async function ensureSeededInsights() {
  const marker = await ContentInsightSeedMarker.findOne({
    key: SEED_MARKER_KEY,
  }).lean();
  if (marker) return { seeded: false, skipped: true };

  await ContentInsightSeedMarker.findOneAndUpdate(
    { key: SEED_MARKER_KEY },
    { key: SEED_MARKER_KEY, seededAt: new Date() },
    { upsert: true, returnDocument: "after" }
  );

  return { seeded: false, marked: true };
}

/** Intentional seed only (CLI / bootstrap). Skips existing slugs. */
async function seedContentInsights() {
  let inserted = 0;
  for (const article of SEED_ARTICLES) {
    const exists = await ContentInsight.findOne({ slug: article.slug }).lean();
    if (exists) continue;
    await ContentInsight.create({
      ...article,
      tags: normalizeTags(article.tags),
      readingMinutes:
        article.readingMinutes ?? estimateReadingMinutes(article.sections),
    });
    inserted += 1;
  }

  await ContentInsightSeedMarker.findOneAndUpdate(
    { key: SEED_MARKER_KEY },
    { key: SEED_MARKER_KEY, seededAt: new Date() },
    { upsert: true, returnDocument: "after" }
  );

  return { inserted };
}

async function listPublicInsights({ language = "all", limit = 50 } = {}) {
  await ensureSeededInsights();

  const filter = { status: "published" };
  if (language !== "all") filter.language = language;

  const rows = await ContentInsight.find(filter)
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return { insights: rows.map(toPublicInsight) };
}

async function getPublicInsightBySlug(slug) {
  await ensureSeededInsights();

  const row = await ContentInsight.findOne({
    slug: String(slug ?? "").trim().toLowerCase(),
    status: "published",
  }).lean();

  if (!row) {
    throw new AppError("Insight not found", 404, "INSIGHT_NOT_FOUND");
  }

  return { insight: toPublicInsight(row) };
}

async function listAdminInsights({
  search = "",
  status = "all",
  language = "all",
  page = 1,
  limit = 20,
} = {}) {
  await ensureSeededInsights();

  const filter = {};
  if (status !== "all") filter.status = status;
  if (language !== "all") filter.language = language;

  const q = search.trim();
  if (q) {
    filter.$or = [
      { title: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { slug: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { tags: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
    ];
  }

  const skip = (page - 1) * limit;
  const [rows, total, published, draft, archived] = await Promise.all([
    ContentInsight.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ContentInsight.countDocuments(filter),
    ContentInsight.countDocuments({ status: "published" }),
    ContentInsight.countDocuments({ status: "draft" }),
    ContentInsight.countDocuments({ status: "archived" }),
  ]);

  return {
    insights: rows.map(toPublicInsight),
    total,
    page,
    limit,
    summary: { published, draft, archived, total: published + draft + archived },
  };
}

async function getAdminInsightById(id) {
  const row = await ContentInsight.findById(id).lean();
  if (!row) {
    throw new AppError("Insight not found", 404, "INSIGHT_NOT_FOUND");
  }
  return { insight: toPublicInsight(row) };
}

async function createInsight(input, adminUserId) {
  const existing = await ContentInsight.findOne({ slug: input.slug }).lean();
  if (existing) {
    throw new AppError("Slug already exists", 409, "SLUG_EXISTS");
  }

  const status = input.status ?? "draft";
  const doc = await ContentInsight.create({
    title: input.title,
    slug: input.slug,
    description: input.description,
    excerpt: input.excerpt || input.description,
    status,
    language: input.language ?? "en",
    tags: normalizeTags(input.tags),
    sections: input.sections,
    readingMinutes:
      input.readingMinutes ?? estimateReadingMinutes(input.sections),
    publishedAt: resolvePublishedAt(status, input.publishedAt),
    createdBy: adminUserId ?? null,
    updatedBy: adminUserId ?? null,
  });

  return { insight: toPublicInsight(doc) };
}

async function updateInsight(id, input, adminUserId) {
  const doc = await ContentInsight.findById(id);
  if (!doc) {
    throw new AppError("Insight not found", 404, "INSIGHT_NOT_FOUND");
  }

  if (input.slug && input.slug !== doc.slug) {
    const clash = await ContentInsight.findOne({
      slug: input.slug,
      _id: { $ne: doc._id },
    }).lean();
    if (clash) {
      throw new AppError("Slug already exists", 409, "SLUG_EXISTS");
    }
    doc.slug = input.slug;
  }

  doc.title = input.title;
  doc.description = input.description;
  doc.excerpt = input.excerpt || input.description;
  doc.status = input.status ?? doc.status;
  doc.language = input.language ?? doc.language;
  doc.tags = normalizeTags(input.tags);
  doc.sections = input.sections;
  doc.readingMinutes =
    input.readingMinutes ?? estimateReadingMinutes(input.sections);
  doc.publishedAt = resolvePublishedAt(doc.status, input.publishedAt);
  doc.updatedBy = adminUserId ?? null;

  await doc.save();
  return { insight: toPublicInsight(doc) };
}

async function deleteInsight(id) {
  const doc = await ContentInsight.findByIdAndDelete(id).lean();
  if (!doc) {
    throw new AppError("Insight not found", 404, "INSIGHT_NOT_FOUND");
  }
  return { deleted: true, id: doc._id.toString() };
}

module.exports = {
  ensureSeededInsights,
  seedContentInsights,
  listPublicInsights,
  getPublicInsightBySlug,
  listAdminInsights,
  getAdminInsightById,
  createInsight,
  updateInsight,
  deleteInsight,
  estimateReadingMinutes,
};
