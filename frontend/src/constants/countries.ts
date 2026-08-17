/** Common ISO 3166-1 alpha-2 countries for international onboarding. */
export type CountryOption = {
  code: string;
  name: string;
};

export const INDIA_COUNTRY_CODE = "IN";

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "IN", name: "India" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "AU", name: "Australia" },
  { code: "BD", name: "Bangladesh" },
  { code: "BH", name: "Bahrain" },
  { code: "CA", name: "Canada" },
  { code: "CN", name: "China" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "GB", name: "United Kingdom" },
  { code: "ID", name: "Indonesia" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "LK", name: "Sri Lanka" },
  { code: "MY", name: "Malaysia" },
  { code: "NP", name: "Nepal" },
  { code: "OM", name: "Oman" },
  { code: "PH", name: "Philippines" },
  { code: "PK", name: "Pakistan" },
  { code: "QA", name: "Qatar" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  { code: "US", name: "United States" },
  { code: "VN", name: "Vietnam" },
  { code: "ZA", name: "South Africa" },
];

export function normalizeCountryCode(value?: string | null): string {
  const raw = (value ?? "").toString().trim().toUpperCase();
  if (!raw) return INDIA_COUNTRY_CODE;
  if (raw === "INDIA") return INDIA_COUNTRY_CODE;
  return raw.length >= 2 ? raw.slice(0, 2) : INDIA_COUNTRY_CODE;
}

export function isIndiaCountry(value?: string | null): boolean {
  return normalizeCountryCode(value) === INDIA_COUNTRY_CODE;
}

export function countryNameFromCode(code?: string | null): string {
  const normalized = normalizeCountryCode(code);
  return (
    COUNTRY_OPTIONS.find((c) => c.code === normalized)?.name ?? normalized
  );
}
