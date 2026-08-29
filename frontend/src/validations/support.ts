import { z } from "zod";

export const SUPPORT_CATEGORIES = [
  "onboarding",
  "matching",
  "billing",
  "technical",
  "other",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const SUPPORT_SOURCES = ["public", "onboarding", "dashboard"] as const;

export type SupportSource = (typeof SUPPORT_SOURCES)[number];

export type ContactSupportMessages = {
  nameRequired: string;
  nameTooLong: string;
  emailInvalid: string;
  categoryRequired: string;
  descriptionMin: string;
  descriptionMax: string;
};

export function createContactSupportSchema(messages: ContactSupportMessages) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, messages.nameRequired)
      .max(120, messages.nameTooLong),
    email: z.string().trim().email(messages.emailInvalid).max(254),
    category: z
      .union([z.literal(""), z.enum(SUPPORT_CATEGORIES)])
      .refine((value): value is SupportCategory => value !== "", {
        message: messages.categoryRequired,
      }),
    description: z
      .string()
      .trim()
      .min(1, messages.descriptionMin)
      .max(4000, messages.descriptionMax),
    companyName: z.string().trim().max(200).optional(),
    website: z.string().max(200).optional(),
  });
}

export type ContactSupportFormValues = {
  name: string;
  email: string;
  category: SupportCategory | "";
  description: string;
  companyName?: string;
  website?: string;
};

export type ContactSupportPayload = Omit<
  ContactSupportFormValues,
  "category" | "website"
> & {
  category: SupportCategory;
  source: SupportSource;
  pageUrl?: string;
};
