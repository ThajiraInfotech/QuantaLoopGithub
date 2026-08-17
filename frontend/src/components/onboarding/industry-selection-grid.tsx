"use client";

import { Check } from "lucide-react";

import {
  onboardingIndustryHoverClass,
  onboardingIndustrySelectedClass,
} from "@/components/onboarding/onboarding-accent";
import { ONBOARDING_INDUSTRIES } from "@/constants/industry-options";
import { cn } from "@/lib/utils";

type IndustrySelectionGridProps = {
  selected: string | null;
  onSelect: (value: string) => void;
};

export function IndustrySelectionGrid({
  selected,
  onSelect,
}: IndustrySelectionGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ONBOARDING_INDUSTRIES.map((opt) => {
        const isSelected = selected === opt.value;
        const Icon = opt.icon;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={cn(
              "relative flex cursor-pointer items-start gap-3 rounded-lg px-4 py-3.5 text-left transition-all duration-[250ms] ease-[ease]",
              isSelected
                ? onboardingIndustrySelectedClass
                : onboardingIndustryHoverClass,
            )}
          >
            {isSelected ? (
              <span className="absolute right-3 top-3 inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#33B573]">
                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                Selected
              </span>
            ) : null}
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#CFEFDF] bg-[#F7FCF9] text-[#33B573]"
              aria-hidden
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 pr-14 text-sm font-medium leading-snug text-zinc-800">
              {opt.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
