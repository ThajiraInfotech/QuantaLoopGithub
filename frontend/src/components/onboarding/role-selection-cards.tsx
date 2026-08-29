"use client";

import { Factory, Recycle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import {
  onboardingCardHoverClass,
  onboardingCardTransitionClass,
} from "@/components/onboarding/onboarding-accent";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store/onboarding-store";
import type { SignupRole } from "@/types/user";

export function RoleSelectionCards() {
  const router = useRouter();
  const t = useTranslations("onboarding.role");
  const setPending = useOnboardingStore((s) => s.setPendingSignupRole);

  const options: {
    role: SignupRole;
    title: string;
    summary: string;
    icon: LucideIcon;
  }[] = useMemo(
    () => [
      {
        role: "material_provider",
        title: t("sellerTitle"),
        summary: t("sellerSummary"),
        icon: Factory,
      },
      {
        role: "verified_buyer",
        title: t("buyerTitle"),
        summary: t("buyerSummary"),
        icon: Recycle,
      },
    ],
    [t]
  );

  function continueWith(role: SignupRole) {
    setPending(role);
    router.push(ROUTES.onboardingMaterials);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:items-stretch">
      {options.map((opt) => {
        const Icon = opt.icon;

        return (
          <div
            key={opt.role}
            role="button"
            tabIndex={0}
            onClick={() => continueWith(opt.role)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                continueWith(opt.role);
              }
            }}
            className="flex h-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33B573] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50"
          >
            <Card
              className={cn(
                "relative flex h-full w-full flex-col bg-white shadow-sm shadow-zinc-950/5",
                onboardingCardTransitionClass,
                onboardingCardHoverClass
              )}
            >
              <CardContent className="flex flex-1 flex-col p-5 sm:p-7">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#CFEFDF] bg-[#F7FCF9] text-[#33B573] sm:h-11 sm:w-11"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>

                <h2 className="mt-4 text-base font-semibold leading-snug text-zinc-900 sm:text-lg">
                  {opt.title}
                </h2>
                <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-700 md:min-h-[4.5rem]">
                  {opt.summary}
                </p>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
