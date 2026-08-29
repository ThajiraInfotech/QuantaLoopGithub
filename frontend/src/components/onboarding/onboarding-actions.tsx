"use client";

import { useTranslations } from "next-intl";

import { onboardingPrimaryButtonClass } from "@/components/onboarding/onboarding-accent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OnboardingActionsProps = {
  onContinue: () => void;
  onSkip?: () => void;
  continueLabel?: string;
  skipLabel?: string;
  submitting?: boolean;
  continueDisabled?: boolean;
};

export function OnboardingActions({
  onContinue,
  onSkip,
  continueLabel,
  skipLabel,
  submitting = false,
  continueDisabled = false,
}: OnboardingActionsProps) {
  const t = useTranslations("onboarding.actions");
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {onSkip ? (
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-11 w-full whitespace-normal border-zinc-200 py-2.5 sm:h-10 sm:w-auto sm:py-2"
          onClick={onSkip}
          disabled={submitting}
        >
          {skipLabel ?? t("skipForNow")}
        </Button>
      ) : (
        <span className="hidden sm:block" />
      )}
      <Button
        type="button"
        variant="accent"
        className={cn(
          "h-auto min-h-11 w-full whitespace-normal px-4 py-2.5 sm:h-10 sm:w-auto sm:min-w-[140px] sm:py-2",
          onboardingPrimaryButtonClass
        )}
        disabled={submitting || continueDisabled}
        onClick={onContinue}
      >
        {submitting ? t("saving") : (continueLabel ?? t("continue"))}
      </Button>
    </div>
  );
}
