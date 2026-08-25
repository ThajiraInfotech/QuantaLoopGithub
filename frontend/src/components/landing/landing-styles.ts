import { cn } from "@/lib/utils";

/** Horizontal padding — phones first, desktop unchanged from lg */
export const landingPad = "px-4 sm:px-6 lg:px-8";

export const landingContainer = cn("mx-auto w-full max-w-6xl", landingPad);

export const landingContainerWide = cn(
  "mx-auto w-full max-w-[1200px]",
  landingPad
);

/** Section vertical rhythm — tighter on phones, same from lg up */
export const landingSectionY = "py-14 sm:py-20 md:py-24 lg:py-28";

export const landingStackGap = "mt-8 sm:mt-12 lg:mt-14";

/** Section H2 used by How it works / Who it's for / Why */
export const landingHeadingXl =
  "font-heading text-[1.75rem] font-bold leading-[1.12] tracking-[-0.02em] text-balance text-foreground sm:text-[2.125rem] lg:text-[clamp(2.5rem,3vw,3rem)] lg:leading-[1.1]";

/** Section H2 used by Problem / Recommendations / Pricing / Access / Final CTA */
export const landingHeading =
  "font-heading text-[1.625rem] font-bold leading-[1.12] tracking-[-0.02em] text-balance text-foreground sm:text-[1.875rem] lg:text-[clamp(2rem,3vw,2.75rem)]";

/** Centered lead under section titles — 22px from md (tablet+) so desktop is unchanged */
export const landingLeadCentered =
  "mx-auto mt-4 max-w-[700px] text-body leading-relaxed text-muted-foreground sm:mt-5 md:mt-6 md:text-[22px] md:leading-[1.6]";

/** Subtle card polish — landing only */
export function landingCardHover(className?: string) {
  return cn(
    "transition-[box-shadow,border-color,transform] duration-200 ease-out",
    "hover:-translate-y-px hover:border-muted-foreground/20 hover:shadow-elevated",
    className
  );
}
