const { z } = require("zod");

const sectionSchema = z.object({
  heading: z.string().trim().min(1).max(200),
  paragraphs: z.array(z.string().trim().min(1).max(5000)).min(1).max(20),
});

const insightBodySchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-safe kebab-case")
    .min(3)
    .max(200),
  description: z.string().trim().min(20).max(320),
  excerpt: z.string().trim().max(400).optional().default(""),
  status: z.enum(["draft", "published", "archived"]).optional().default("draft"),
  language: z.enum(["en", "hi", "ta"]).optional().default("en"),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).optional().default([]),
  sections: z.array(sectionSchema).min(1).max(30),
  readingMinutes: z.coerce.number().int().min(1).max(60).optional(),
  publishedAt: z.union([z.string().min(1), z.null()]).optional().nullable(),
});

const listAdminInsightsQuerySchema = z.object({
  search: z.string().optional().default(""),
  status: z
    .enum(["all", "draft", "published", "archived"])
    .optional()
    .default("all"),
  language: z.enum(["all", "en", "hi", "ta"]).optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const listPublicInsightsQuerySchema = z.object({
  language: z.enum(["all", "en", "hi", "ta"]).optional().default("all"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

function safeParseInsightBody(body) {
  return insightBodySchema.safeParse(body);
}

function safeParseListAdminInsights(query) {
  return listAdminInsightsQuerySchema.safeParse(query);
}

function safeParseListPublicInsights(query) {
  return listPublicInsightsQuerySchema.safeParse(query);
}

module.exports = {
  safeParseInsightBody,
  safeParseListAdminInsights,
  safeParseListPublicInsights,
};
