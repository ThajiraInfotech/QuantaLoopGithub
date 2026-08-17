import { z } from "zod";

export const profilePatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    companyName: z.string().min(1).max(200).optional(),
    companyDescription: z.string().max(8000).optional(),
    website: z.union([z.string().url().max(500), z.literal("")]).optional(),
    industriesHandled: z.array(z.string().max(120)).max(40).optional(),
    materialsHandled: z.array(z.string().max(120)).max(80).optional(),
    primaryIndustry: z.string().max(120).optional(),
    industryType: z.string().max(120).optional(),
    secondaryIndustries: z.array(z.string().max(120)).max(39).optional(),
    customIndustry: z.string().max(120).optional(),
    materialTypes: z.array(z.string().max(120)).max(80).optional(),
    preferredMaterialCategories: z.array(z.string().max(120)).max(40).optional(),
    requiredMaterialCategories: z.array(z.string().max(120)).max(40).optional(),
    operationalLocation: z.string().max(300).optional(),
    location: z.string().max(300).optional(),
    stateCode: z.string().max(8).optional(),
    state: z.string().max(80).optional(),
    region: z.string().max(120).optional(),
    customRegion: z.string().max(120).optional(),
    city: z.string().max(300).optional(),
    country: z.string().max(8).optional(),
    employeeRange: z.string().max(80).optional(),
    establishedYear: z.coerce.number().int().min(1800).max(2100).optional(),
    responseRate: z.coerce.number().min(0).max(100).optional(),
    averageResponseTime: z.string().max(120).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field is required",
  });

export type ProfilePatchInput = z.infer<typeof profilePatchSchema>;

export const companyProfileFormSchema = z.object({
  name: z.string().min(1).max(120),
  companyName: z.string().min(1).max(200),
  companyDescription: z.string().max(8000),
  website: z.union([z.string().url().max(500), z.literal("")]),
  industriesText: z.string().max(2000),
  materialsText: z.string().max(4000),
  industryType: z.string().max(120),
  operationalLocation: z.string().max(300),
  location: z.string().max(300),
  employeeRange: z.string().max(80),
  establishedYear: z.string().max(4),
  responseRate: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    if (typeof val === "number" && Number.isNaN(val)) return 0;
    const n = typeof val === "number" ? val : Number(val);
    return Number.isFinite(n) ? n : 0;
  }, z.number().min(0).max(100)),
  averageResponseTime: z.string().max(120),
});

export type CompanyProfileFormValues = z.infer<typeof companyProfileFormSchema>;

function splitList(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 80);
}

export function companyFormToPatch(
  values: CompanyProfileFormValues
): ProfilePatchInput {
  const industriesHandled = splitList(values.industriesText).slice(0, 40);
  const materialsHandled = splitList(values.materialsText);
  const yearStr = values.establishedYear?.trim() ?? "";
  const establishedYear =
    yearStr && /^\d{4}$/.test(yearStr)
      ? Number.parseInt(yearStr, 10)
      : undefined;

  const patch: ProfilePatchInput = {
    name: values.name,
    companyName: values.companyName,
    companyDescription: values.companyDescription,
    website: values.website,
    industriesHandled,
    materialsHandled,
    industryType: values.industryType,
    operationalLocation: values.operationalLocation,
    location: values.location,
    employeeRange: values.employeeRange,
    responseRate: values.responseRate,
    averageResponseTime: values.averageResponseTime,
  };
  if (establishedYear !== undefined) {
    patch.establishedYear = establishedYear;
  }
  return patch;
}
