/** Quanta Loop onboarding accent — strategic use only */
export const ONBOARDING_ACCENT = {
  green: "#33B573",
  greenHover: "#2e9f66",
  greenMuted: "#F7FCF9",
  greenBorder: "#CFEFDF",
  greenBorderSoft: "#DCEFE5",
  greenShadowHover: "0 12px 30px rgba(51, 181, 115, 0.1)",
} as const;

export const onboardingPrimaryButtonClass =
  "bg-[#33B573] text-white hover:bg-[#2e9f66] active:bg-[#2a9660]";

/** 16px on phones so iOS does not zoom the field on focus */
export const onboardingFieldClass =
  "h-12 border-zinc-200 bg-white text-base sm:h-10 sm:text-small";

export const onboardingCardMinHeightClass = "min-h-[340px]";

export const onboardingCardSelectedClass =
  "border-2 border-[#33B573] bg-[#F7FCF9] -translate-y-0.5";

export const onboardingCardHoverClass =
  "border border-zinc-200/80 hover:-translate-y-0.5 hover:border-[#33B573] hover:bg-[#F7FCF9] hover:shadow-[0_12px_30px_rgba(51,181,115,0.1)]";

export const onboardingCardTransitionClass =
  "h-full cursor-pointer transition-all duration-[250ms] ease-[ease]";

export const onboardingIndustrySelectedClass =
  "border-2 border-[#33B573] bg-[#F7FCF9] shadow-[0_8px_20px_rgba(51,181,115,0.08)]";

export const onboardingIndustryHoverClass =
  "border border-zinc-200/80 bg-white hover:border-[#33B573] hover:bg-[#F7FCF9] hover:shadow-[0_8px_20px_rgba(51,181,115,0.06)] hover:-translate-y-0.5";
