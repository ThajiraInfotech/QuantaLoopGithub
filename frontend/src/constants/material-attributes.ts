export const MATERIAL_FORM_OPTIONS = [
  "Solid",
  "Liquid",
  "Sludge",
  "Powder",
  "Granules",
  "Flakes",
  "Shavings",
  "Bales",
] as const;

export type MaterialFormOption = (typeof MATERIAL_FORM_OPTIONS)[number];

/** Select sentinel for custom form; never persist this value. */
export const MATERIAL_FORM_OTHER = "__other_form__";

export function isKnownMaterialForm(value: string): boolean {
  const key = value.trim().toLowerCase();
  if (!key) return false;
  return MATERIAL_FORM_OPTIONS.some((item) => item.toLowerCase() === key);
}

export function isOtherFormLabelOnly(value: string): boolean {
  const key = value.trim().toLowerCase();
  return key === "other" || key === "others";
}

export const MATERIAL_CLEANLINESS_OPTIONS = [
  "Clean",
  "Mixed",
  "Contaminated",
] as const;

export type MaterialCleanlinessOption =
  (typeof MATERIAL_CLEANLINESS_OPTIONS)[number];

/** Select sentinel for custom cleanliness; never persist this value. */
export const MATERIAL_CLEANLINESS_OTHER = "__other_cleanliness__";

export function isKnownMaterialCleanliness(value: string): boolean {
  const key = value.trim().toLowerCase();
  if (!key) return false;
  return MATERIAL_CLEANLINESS_OPTIONS.some(
    (item) => item.toLowerCase() === key
  );
}

export function isOtherCleanlinessLabelOnly(value: string): boolean {
  const key = value.trim().toLowerCase();
  return key === "other" || key === "others";
}
