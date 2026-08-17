import { defineRouting } from "next-intl/routing";

export const locales = ["en", "hi", "ta"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale: "en",
  localePrefix: "never",
});

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeLabels: Record<AppLocale, string> = {
  en: "English",
  hi: "हिंदी",
  ta: "தமிழ்",
};
