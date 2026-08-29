const { z } = require("zod");

const publicRegistrationRoleSchema = z.enum([
  "material_provider",
  "verified_buyer",
]);

const registerBodySchema = z.object({
  name: z.string().min(1).max(120),
  companyName: z.string().min(1).max(200),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  role: publicRegistrationRoleSchema.optional(),
  industryType: z.string().max(120).optional(),
  materialTypes: z.array(z.string().max(80)).max(50).optional(),
  preferredMaterialCategories: z.array(z.string().max(120)).max(40).optional(),
  requiredMaterialCategories: z.array(z.string().max(120)).max(40).optional(),
  state: z.string().max(80).optional(),
  city: z.string().max(300).optional(),
  stateCode: z.string().max(8).optional(),
  country: z.string().max(8).optional(),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms and Privacy Policy" }),
  }),
  termsVersion: z.string().trim().max(40).optional(),
});

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional(),
});

const googleAuthBodySchema = z.object({
  credential: z.string().min(1),
  rememberMe: z.boolean().optional(),
  /** login = existing accounts only */
  mode: z.enum(["login", "signup"]).optional().default("login"),
});

const googlePreviewBodySchema = z.object({
  credential: z.string().min(1),
});

const googleRegisterBodySchema = z
  .object({
    credential: z.string().min(1),
    name: z.string().min(1).max(120),
    companyName: z.string().min(1).max(200),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(1),
    role: publicRegistrationRoleSchema,
    acceptedTerms: z.literal(true, {
      errorMap: () => ({
        message: "You must accept the Terms and Privacy Policy",
      }),
    }),
    termsVersion: z.string().trim().max(40).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const forgotPasswordBodySchema = z.object({
  email: z.string().email().max(254),
});

const resetPasswordBodySchema = z.object({
  email: z.string().email().max(254),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Reset code must be 6 digits"),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const verifyEmailBodySchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Verification code must be 6 digits"),
});

const resendVerificationBodySchema = z.object({
  email: z.string().email().max(254),
});

const completeAccountSetupBodySchema = z
  .object({
    name: z.string().min(1).max(120),
    companyName: z.string().min(1).max(200),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
    role: publicRegistrationRoleSchema,
    acceptedTerms: z.literal(true, {
      errorMap: () => ({
        message: "You must accept the Terms and Privacy Policy",
      }),
    }),
    termsVersion: z.string().trim().max(40).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function parseBody(schema, body) {
  return schema.safeParse(body);
}

module.exports = {
  registerBodySchema,
  loginBodySchema,
  googleAuthBodySchema,
  googlePreviewBodySchema,
  googleRegisterBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
  resendVerificationBodySchema,
  completeAccountSetupBodySchema,
  parseBody,
};
