"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

const trustKeys = ["item1", "item2", "item3"] as const;

export function OnboardingTrustBanner() {
  const t = useTranslations("onboarding.trust");

  return (
    <div
      className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg border border-[#DCEFE5] border-l-4 border-l-[#33B573] bg-[#F7FCF9] px-3 py-2.5 sm:gap-x-5 sm:px-4"
      aria-label="Network trust indicators"
    >
      {trustKeys.map((key) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600"
        >
          <Check className="h-3 w-3 shrink-0 text-[#33B573]" strokeWidth={2.5} aria-hidden />
          {t(key)}
        </span>
      ))}
    </div>
  );
}
