import { z } from "zod";

const signupRoleSchema = z.enum(["material_provider", "verified_buyer"]);

export type AuthValidationMessages = {
  email: string;
  passwordRequired: string;
  passwordMin: string;
  passwordMax: string;
  confirmPassword: string;
  passwordsMismatch: string;
  contactNameRequired: string;
  companyRequired: string;
};

export function createLoginSchema(messages: Pick<AuthValidationMessages, "email" | "passwordRequired">) {
  return z.object({
    email: z.string().email(messages.email),
    password: z.string().min(1, messages.passwordRequired),
    rememberMe: z.boolean().optional(),
  });
}

export function createForgotPasswordSchema(messages: Pick<AuthValidationMessages, "email">) {
  return z.object({
    email: z.string().email(messages.email),
  });
}

export function createResetPasswordSchema(
  messages: Pick<
    AuthValidationMessages,
    "passwordMin" | "passwordMax" | "confirmPassword" | "passwordsMismatch"
  >
) {
  return z
    .object({
      password: z
        .string()
        .min(8, messages.passwordMin)
        .max(128, messages.passwordMax),
      confirmPassword: z.string().min(1, messages.confirmPassword),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordsMismatch,
      path: ["confirmPassword"],
    });
}

export function createRegisterSchema(messages: AuthValidationMessages) {
  return z
    .object({
      name: z.string().min(1, messages.contactNameRequired).max(120),
      companyName: z.string().min(1, messages.companyRequired).max(200),
      email: z.string().email(messages.email).max(254),
      password: z
        .string()
        .min(8, messages.passwordMin)
        .max(128, messages.passwordMax),
      confirmPassword: z.string().min(1, messages.confirmPassword),
      role: signupRoleSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordsMismatch,
      path: ["confirmPassword"],
    });
}

export function createGoogleAccountSetupSchema(messages: AuthValidationMessages) {
  return z
    .object({
      name: z.string().min(1, messages.contactNameRequired).max(120),
      companyName: z.string().min(1, messages.companyRequired).max(200),
      password: z
        .string()
        .min(8, messages.passwordMin)
        .max(128, messages.passwordMax),
      confirmPassword: z.string().min(1, messages.confirmPassword),
      role: signupRoleSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordsMismatch,
      path: ["confirmPassword"],
    });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
export type ForgotPasswordFormValues = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;
export type ResetPasswordFormValues = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;
export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;
export type RegisterRequestBody = Omit<RegisterFormValues, "confirmPassword"> & {
  country?: string;
  state?: string;
  stateCode?: string;
  city?: string;
  location?: string;
  materialTypes?: string[];
  preferredMaterialCategories?: string[];
  requiredMaterialCategories?: string[];
};
export type GoogleAccountSetupFormValues = z.infer<
  ReturnType<typeof createGoogleAccountSetupSchema>
>;
export type GoogleAccountSetupRequestBody = GoogleAccountSetupFormValues;

export type GoogleRegisterRequestBody = GoogleAccountSetupFormValues & {
  credential: string;
};
