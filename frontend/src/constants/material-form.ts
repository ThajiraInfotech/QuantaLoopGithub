export const MATERIAL_UNIT_OPTIONS = [
  "MT",
  "KG",
  "Tons",
  "Drums",
  "Loads",
  "Bales",
  "Litres",
] as const;

/** Select sentinel for custom units; never persist this value. */
export const MATERIAL_UNIT_OTHER = "__other_unit__";

export type MaterialUnitOption = (typeof MATERIAL_UNIT_OPTIONS)[number];

export function isKnownMaterialUnit(unit: string): boolean {
  const key = unit.trim().toLowerCase();
  if (!key) return false;
  return MATERIAL_UNIT_OPTIONS.some((item) => item.toLowerCase() === key);
}

/** Reject bare "Other"/"Others"/"Units" as the stored unit name. */
export function isOtherUnitLabelOnly(unit: string): boolean {
  const key = unit.trim().toLowerCase();
  return key === "other" || key === "others" || key === "units";
}
