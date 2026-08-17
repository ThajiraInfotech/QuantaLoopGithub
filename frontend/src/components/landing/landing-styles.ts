import { cn } from "@/lib/utils";

/** ~12–15% tighter than py-24 / sm:py-32 — shared landing rhythm */
export const landingSectionY = "py-20 sm:py-28";

export const landingStackGap = "mt-12 sm:mt-14";

/** Subtle card polish — landing only */
export function landingCardHover(className?: string) {
  return cn(
    "transition-[box-shadow,border-color,transform] duration-200 ease-out",
    "hover:-translate-y-px hover:border-muted-foreground/20 hover:shadow-elevated",
    className
  );
}
