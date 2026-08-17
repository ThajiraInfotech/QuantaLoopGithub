"use client";

import { Check, Factory, Recycle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  onboardingCardHoverClass,
  onboardingCardSelectedClass,
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
  const tCommon = useTranslations("common");
  const setPending = useOnboardingStore((s) => s.setPendingSignupRole);
  const [selected, setSelected] = useState<SignupRole | null>(null);

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
    <div className="grid gap-5 md:grid-cols-2 md:items-stretch">
      {options.map((opt) => {
        const isSelected = selected === opt.role;
        const Icon = opt.icon;

        return (
          <div
            key={opt.role}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={() => setSelected(opt.role)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelected(opt.role);
              }
            }}
            className="flex h-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33B573] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50"
          >
            <Card
              className={cn(
                "flex h-full w-full flex-col bg-white shadow-sm shadow-zinc-950/5",
                onboardingCardTransitionClass,
                isSelected
                  ? onboardingCardSelectedClass
                  : onboardingCardHoverClass
              )}
            >
              {isSelected ? (
                <span className="absolute right-5 top-5 z-10 inline-flex items-center gap-1 text-xs font-semibold text-[#33B573]">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                  {tCommon("selected")}
                </span>
              ) : null}

              <CardContent className="flex flex-1 flex-col p-6 sm:p-7">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#CFEFDF] bg-[#F7FCF9] text-[#33B573]"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>

                <h2 className="mt-4 pr-16 text-lg font-semibold leading-snug text-zinc-900">
                  {opt.title}
                </h2>
                <p className="mt-2 min-h-[4.5rem] text-sm font-medium leading-relaxed text-zinc-700">
                  {opt.summary}
                </p>

                <span
                  role="presentation"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(opt.role);
                    continueWith(opt.role);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      e.preventDefault();
                      setSelected(opt.role);
                      continueWith(opt.role);
                    }
                  }}
                  className="mt-auto w-fit cursor-pointer pt-5 text-sm font-semibold text-[#33B573] transition-colors duration-[250ms] ease-[ease] hover:opacity-90"
                >
                  {t("continueArrow")}
                </span>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
