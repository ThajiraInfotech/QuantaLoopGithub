"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { LOCALE_COOKIE, localeLabels, locales, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

function setLocaleCookie(locale: AppLocale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
}

export function LanguageSwitcher({
  className,
  compact = false,
}: LanguageSwitcherProps) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(nextLocale: AppLocale) {
    if (nextLocale === locale) return;

    setLocaleCookie(nextLocale);

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2",
        compact ? "text-xs" : "text-sm",
        className
      )}
    >
      <span className="sr-only">{t("language")}</span>
      <select
        aria-label={t("language")}
        value={locale}
        disabled={isPending}
        onChange={(event) => onChange(event.target.value as AppLocale)}
        className={cn(
          "cursor-pointer rounded-lg border border-border bg-background font-medium text-foreground transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          compact
            ? "h-8 px-2 py-1 text-xs"
            : "h-9 px-2.5 py-1.5 text-sm"
        )}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeLabels[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
