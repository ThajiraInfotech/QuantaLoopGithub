const { z } = require("zod");
const { GSTIN_REGEX } = require("./gst.engine");

const addressSchema = z.object({
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().max(80).optional().default(""),
  stateCode: z.string().trim().max(8).optional().default(""),
  pincode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(8),
});

const upsertBillingProfileSchema = z
  .object({
    legalName: z.string().trim().min(2).max(200),
    billingEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
    customerType: z.enum(["individual", "business"]).optional().default("business"),
    gstRegistered: z.boolean().optional().default(false),
    gstin: z.string().trim().max(15).optional().default(""),
    taxId: z.string().trim().max(40).optional().default(""),
    address: addressSchema,
  })
  .superRefine((value, ctx) => {
    const country = String(value.address.country || "").toUpperCase();
    if (country === "IN") {
      if (!value.address.stateCode?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["address", "stateCode"],
          message: "State is required for India",
        });
      }
      if (value.gstRegistered) {
        const gstin = String(value.gstin || "")
          .trim()
          .toUpperCase();
        if (!GSTIN_REGEX.test(gstin)) {
          ctx.addIssue({
            code: "custom",
            path: ["gstin"],
            message: "Valid GSTIN is required when GST registered",
          });
        }
      }
    }
  });

const previewSchema = z.object({
  planCode: z.string().trim().min(1).max(80).optional(),
  planId: z.string().trim().min(1).max(80).optional(),
});

function parseOrThrow(schema, value) {
  return schema.safeParse(value);
}

module.exports = {
  upsertBillingProfileSchema,
  previewSchema,
  parseOrThrow,
};
