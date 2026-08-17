import {
  Building2,
  Car,
  Cpu,
  Factory,
  FileText,
  FlaskConical,
  Layers,
  Pill,
  Shirt,
  Truck,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type OnboardingIndustryOption = {
  value: string;
  icon: LucideIcon;
};

export const ONBOARDING_INDUSTRIES: readonly OnboardingIndustryOption[] = [
  { value: "Primary metals", icon: Layers },
  { value: "Chemicals & petrochemicals", icon: FlaskConical },
  { value: "Paper & packaging", icon: FileText },
  { value: "Plastics & polymers", icon: Factory },
  { value: "Textiles", icon: Shirt },
  { value: "Food & beverage processing", icon: UtensilsCrossed },
  { value: "Pharmaceuticals", icon: Pill },
  { value: "Electronics assembly", icon: Cpu },
  { value: "Automotive components", icon: Car },
  { value: "Energy & utilities", icon: Zap },
  { value: "Construction materials", icon: Building2 },
  { value: "Logistics & warehousing", icon: Truck },
] as const;

/** @deprecated Use ONBOARDING_INDUSTRIES — label list for backwards compatibility */
export const ONBOARDING_INDUSTRY_OPTIONS = ONBOARDING_INDUSTRIES.map(
  (item) => item.value
) as readonly string[];

export type OnboardingIndustry = (typeof ONBOARDING_INDUSTRIES)[number]["value"];
