const { z } = require("zod");

const listParticipantsQuerySchema = z.object({
  search: z.string().optional().default(""),
  role: z.enum(["all", "material_provider", "verified_buyer"]).optional().default("all"),
  accountStatus: z.enum(["all", "active", "suspended"]).optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const patchAccountStatusSchema = z.object({
  accountStatus: z.enum(["active", "suspended"]),
});

const listAdminMaterialsQuerySchema = z.object({
  search: z.string().optional().default(""),
  status: z
    .enum(["all", "available", "in_discussion", "completed", "archived"])
    .optional()
    .default("all"),
  materialType: z.string().optional().default("all"),
  location: z.string().optional().default(""),
  reportedOnly: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((v) => v === true || v === "true"),
  participant: z.string().optional(),
  sort: z
    .enum(["newest", "oldest", "most_interests", "most_reports"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const moderateMaterialSchema = z.object({
  action: z.enum(["archive", "restore"]),
});

const bulkModerateMaterialsSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  action: z.enum(["archive", "restore"]),
});

const listAdminInterestsQuerySchema = z.object({
  search: z.string().optional().default(""),
  status: z
    .enum(["all", "pending", "in_discussion", "completed"])
    .optional()
    .default("all"),
  participant: z.string().optional(),
  scope: z.enum(["created", "received", "completed"]).optional(),
  material: z.string().optional(),
  buyer: z.string().optional(),
  provider: z.string().optional(),
  materialType: z.string().optional().default("all"),
  location: z.string().optional().default(""),
  reportedOnly: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((v) => v === true || v === "true"),
  sort: z
    .enum(["newest", "oldest", "most_messages", "most_reports"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const listAdminInvoicesQuerySchema = z.object({
  search: z.string().optional().default(""),
  month: z
    .string()
    .optional()
    .default("")
    .transform((value) => String(value || "").trim())
    .refine((value) => value === "" || /^\d{4}-\d{2}$/.test(value), {
      message: "month must be YYYY-MM",
    }),
  taxType: z
    .enum(["all", "cgst_sgst", "igst", "export_zero_rated"])
    .optional()
    .default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

function safeParseListParticipants(query) {
  return listParticipantsQuerySchema.safeParse(query);
}

function safeParseAccountStatus(body) {
  return patchAccountStatusSchema.safeParse(body);
}

function safeParseListAdminMaterials(query) {
  return listAdminMaterialsQuerySchema.safeParse(query);
}

function safeParseModerateMaterial(body) {
  return moderateMaterialSchema.safeParse(body);
}

function safeParseBulkModerateMaterials(body) {
  return bulkModerateMaterialsSchema.safeParse(body);
}

const listAdminReportsQuerySchema = z.object({
  search: z.string().optional().default(""),
  status: z.enum(["all", "open", "resolved"]).optional().default("open"),
  targetType: z.enum(["all", "material", "participant"]).optional().default("all"),
  reason: z
    .enum([
      "all",
      "misleading_information",
      "spam",
      "inactive_participant",
    ])
    .optional()
    .default("all"),
  reporter: z.string().optional(),
  participant: z.string().optional(),
  material: z.string().optional(),
  interest: z.string().optional(),
  dateFrom: z.string().optional().default(""),
  dateTo: z.string().optional().default(""),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

function safeParseListAdminInvoices(query) {
  return listAdminInvoicesQuerySchema.safeParse(query);
}

function safeParseListAdminInterests(query) {
  return listAdminInterestsQuerySchema.safeParse(query);
}

function safeParseListAdminReports(query) {
  return listAdminReportsQuerySchema.safeParse(query);
}

module.exports = {
  safeParseListParticipants,
  safeParseAccountStatus,
  safeParseListAdminMaterials,
  safeParseModerateMaterial,
  safeParseBulkModerateMaterials,
  safeParseListAdminInterests,
  safeParseListAdminReports,
  safeParseListAdminInvoices,
};
