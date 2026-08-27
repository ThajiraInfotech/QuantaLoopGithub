const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REMEMBER_EXPIRES_IN: z.string().default("30d"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().default("Quanta Loop"),
  SUPPORT_EMAIL: z.string().email().default("support@quantaloop.com"),
  API_PUBLIC_URL: z.string().url().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_PLAN_ID_ANNUAL_ACCESS: z.string().optional(),
  RAZORPAY_PLAN_MAP: z.string().optional(),
  // Optional temporary smoke-test amount in paise (100 = ₹1). Empty = ₹6,999.
  ANNUAL_ACCESS_AMOUNT_PAISE: z.string().optional(),
  // Billing / GST (Quanta Loop owns invoices; Razorpay collects payment only)
  BILLING_SUPPLIER_STATE_CODE: z.string().optional().default("TN"),
  BILLING_SUPPLIER_STATE: z.string().optional().default("Tamil Nadu"),
  BILLING_SUPPLIER_GSTIN: z.string().optional(),
  BILLING_SAC_CODE: z.string().optional(),
  BILLING_EXPORT_TREATMENT: z
    .enum(["zero_rated_lut", "manual_review", "disabled"])
    .optional()
    .default("zero_rated_lut"),
  BILLING_INVOICE_PREFIX: z.string().optional().default("QL"),
  BILLING_SELLER_LEGAL_NAME: z.string().optional().default("Quanta Loop"),
  BILLING_SELLER_ADDRESS: z.string().optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${message}`);
  }
  return parsed.data;
}

module.exports = { loadEnv };
