import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { LOCALE_COOKIE, routing, type AppLocale } from "./routing";

function resolveLocale(value: string | undefined): AppLocale {
  if (value && routing.locales.includes(value as AppLocale)) {
    return value as AppLocale;
  }

  return routing.defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const requestedLocale = await requestLocale;

  const locale = resolveLocale(cookieLocale ?? requestedLocale ?? undefined);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
