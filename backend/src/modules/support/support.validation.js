const { z } = require("zod");

const supportCategories = [
  "onboarding",
  "matching",
  "billing",
  "technical",
  "other",
];

const supportSources = ["public", "onboarding", "dashboard"];

const contactSupportSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name is too long"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(254, "Email is too long"),
  category: z.enum(supportCategories, {
    required_error: "Please select a topic",
    invalid_type_error: "Please select a topic",
  }),
  description: z
    .string()
    .trim()
    .min(1, "Please describe how we can help")
    .max(4000, "Description is too long"),
  companyName: z.string().trim().max(200).optional().or(z.literal("")),
  source: z.enum(supportSources).default("public"),
  pageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  /** Honeypot — bots that fill this are silently accepted */
  website: z.string().max(200).optional().default(""),
});

function safeParseContact(body) {
  return contactSupportSchema.safeParse(body);
}

module.exports = {
  contactSupportSchema,
  safeParseContact,
  supportCategories,
  supportSources,
};
