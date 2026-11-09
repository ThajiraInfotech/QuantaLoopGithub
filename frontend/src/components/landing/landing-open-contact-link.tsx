"use client";

import { cn } from "@/lib/utils";

export const LANDING_OPEN_CONTACT_EVENT = "landing:open-contact-support";

type LandingOpenContactLinkProps = {
  label: string;
  className?: string;
};

export function LandingOpenContactLink({
  label,
  className,
}: LandingOpenContactLinkProps) {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent(LANDING_OPEN_CONTACT_EVENT));
      }}
      className={cn(className)}
    >
      {label}
    </button>
  );
}
