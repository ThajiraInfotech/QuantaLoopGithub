const { z } = require("zod");

const identifier = z.string().trim().min(3).max(120);

const createCheckoutSchema = z
  .object({
    planId: z.string().trim().min(1).max(80).optional(),
    planCode: z.string().trim().min(1).max(80).optional(),
    idempotencyKey: z.string().trim().min(8).max(120).optional(),
  })
  .transform((value) => ({
    ...value,
    planId: value.planId || value.planCode,
  }))
  .refine((value) => Boolean(value.planId), {
    message: "planId or planCode is required",
    path: ["planId"],
  });

const cancelCurrentSchema = z.object({
  cancelAtCycleEnd: z.boolean().optional().default(true),
});

const verifyCheckoutSchema = z.object({
  razorpayPaymentId: identifier,
  razorpaySubscriptionId: identifier,
  razorpaySignature: z.string().regex(/^[a-f0-9]{64}$/i),
});

const cancelSchema = z.object({
  cancelAtCycleEnd: z.boolean().optional().default(true),
});

function parseOrThrow(schema, value) {
  const parsed = schema.safeParse(value);
  return parsed;
}

module.exports = {
  createCheckoutSchema,
  verifyCheckoutSchema,
  cancelSchema,
  cancelCurrentSchema,
  parseOrThrow,
};
