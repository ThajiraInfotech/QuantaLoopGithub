"use client";

import Link from "next/link";
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
  profileLink?: string;
};

export function OnboardingActions({
  onContinue,
  onSkip,
  continueLabel,
  skipLabel,
  submitting = false,
  continueDisabled = false,
  profileLink,
}: OnboardingActionsProps) {
  const t = useTranslations("onboarding.actions");
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onSkip ? (
          <Button
            type="button"
            variant="outline"
            className="w-full border-zinc-200 sm:w-auto"
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
          className={cn("w-full sm:w-auto sm:min-w-[140px]", onboardingPrimaryButtonClass)}
          disabled={submitting || continueDisabled}
          onClick={onContinue}
        >
          {submitting ? t("saving") : (continueLabel ?? t("continue"))}
        </Button>
      </div>
      {profileLink ? (
        <p className="text-center text-xs text-zinc-500">
          <Link
            href={profileLink}
            className="font-medium text-zinc-700 underline-offset-4 hover:underline"
          >
            {t("finishLaterInProfile")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
