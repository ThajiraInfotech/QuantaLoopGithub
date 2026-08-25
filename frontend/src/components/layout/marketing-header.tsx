"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Logo } from "@/components/shared/logo";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const ghostLink =
  "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50";

const primaryLink =
  "inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50";

const SUPPORT_MAIL =
  "mailto:access@quantaloop.com?subject=Quanta%20Loop%20Onboarding%20Support";

type MarketingHeaderProps = {
  variant?: "marketing" | "onboarding";
};

export function MarketingHeader({ variant = "marketing" }: MarketingHeaderProps) {
  const t = useTranslations("onboarding.header");
  const tCommon = useTranslations("common");

  return (
    <header className="border-b border-zinc-200/80 bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Logo className="h-8 sm:h-9" />
        <nav className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-3">
          <LanguageSwitcher compact />
          <Link href={ROUTES.login} className={cn(ghostLink)}>
            {tCommon("signIn")}
          </Link>
          {variant === "onboarding" ? (
            <a
              href={SUPPORT_MAIL}
              className={cn(ghostLink, "hidden sm:inline-flex")}
            >
              {t("contactTeam")}
            </a>
          ) : (
            <Link href={ROUTES.onboardingRole} className={cn(primaryLink)}>
              {t("getEarlyAccess")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
