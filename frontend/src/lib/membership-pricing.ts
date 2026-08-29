import { INDIA_COUNTRY_CODE } from "@/constants/countries";

/** Keep in sync with backend subscriptionCatalog defaults. */
export const ANNUAL_MEMBERSHIP_INR = 6999;
export const ANNUAL_MEMBERSHIP_USD = 99;

export type MembershipPrice = {
  amount: number;
  currency: "INR" | "USD";
};

export function membershipPriceForCountry(country?: string | null): MembershipPrice {
  const code = String(country || INDIA_COUNTRY_CODE)
    .trim()
    .toUpperCase();
  if (code && code !== INDIA_COUNTRY_CODE) {
    return { amount: ANNUAL_MEMBERSHIP_USD, currency: "USD" };
  }
  return { amount: ANNUAL_MEMBERSHIP_INR, currency: "INR" };
}

export function formatMembershipPrice(
  amount: number,
  currency: string = "INR"
): string {
  const code = String(currency || "INR").toUpperCase();
  if (code === "USD") {
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
