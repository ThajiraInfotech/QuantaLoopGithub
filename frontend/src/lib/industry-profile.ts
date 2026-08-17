import type { ProfilePatchInput } from "@/validations/profile";

export type IndustryProfileInput = {
  primaryIndustry: string;
  secondaryIndustries: string[];
  customIndustry?: string;
};

export function buildIndustriesHandled({
  primaryIndustry,
  secondaryIndustries,
  customIndustry = "",
}: IndustryProfileInput): string[] {
  const custom = customIndustry.trim();
  const seen = new Set<string>();
  const result: string[] = [];

  for (const label of [
    primaryIndustry,
    ...secondaryIndustries,
    ...(custom ? [custom] : []),
  ]) {
    const trimmed = label.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result.slice(0, 40);
}

export function industryProfileToPatch(
  input: IndustryProfileInput,
): ProfilePatchInput {
  const custom = input.customIndustry?.trim() ?? "";
  return {
    primaryIndustry: input.primaryIndustry,
    industryType: input.primaryIndustry,
    secondaryIndustries: input.secondaryIndustries,
    customIndustry: custom,
    industriesHandled: buildIndustriesHandled({
      ...input,
      customIndustry: custom,
    }),
  };
}
