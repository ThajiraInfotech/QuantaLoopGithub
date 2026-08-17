"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const stepKeys = [
  "roleSelection",
  "materialCategories",
  "stateCity",
  "accountSetup",
  "membership",
] as const;

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

type OnboardingProgressProps = {
  activeStep: OnboardingStep;
};

export function OnboardingProgress({ activeStep }: OnboardingProgressProps) {
  const t = useTranslations("onboarding.progress");
  const steps = stepKeys.map((key, index) => ({
    n: (index + 1) as OnboardingStep,
    label: t(key),
  }));
  const current = steps.find((s) => s.n === activeStep) ?? steps[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-zinc-500">
        <span className="text-zinc-700">{current.label}</span>
        <span className="tabular-nums">
          {t("stepOf", { current: activeStep, total: steps.length })}
        </span>
      </div>
      <div className="flex gap-1.5">
        {steps.map((s) => {
          const done = s.n < activeStep;
          const isCurrent = s.n === activeStep;
          return (
            <div
              key={s.n}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-[250ms] ease-[ease]",
                isCurrent && "bg-[#33B573]",
                done && !isCurrent && "bg-zinc-300",
                !done && !isCurrent && "bg-zinc-200"
              )}
              title={s.label}
            />
          );
        })}
      </div>
    </div>
  );
}
