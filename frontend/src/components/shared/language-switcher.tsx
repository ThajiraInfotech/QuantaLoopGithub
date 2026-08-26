"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { LOCALE_COOKIE, localeLabels, locales, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
  /** `nav` matches landing action-row height and removes heavy chrome */
  variant?: "default" | "nav";
};

function setLocaleCookie(locale: AppLocale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
}

export function LanguageSwitcher({
  className,
  compact = false,
  variant = "default",
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

  const nav = variant === "nav";

  return (
    <label
      className={cn(
        "inline-flex items-center",
        compact && !nav ? "text-xs" : "text-sm",
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
          "cursor-pointer font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          nav
            ? "h-9 rounded-full border-transparent bg-transparent px-3.5 text-[13px] tracking-[-0.01em] text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
            : "rounded-lg border border-border bg-background text-foreground",
          !nav && (compact ? "h-8 px-2 py-1 text-xs" : "h-9 px-2.5 py-1.5 text-sm")
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
