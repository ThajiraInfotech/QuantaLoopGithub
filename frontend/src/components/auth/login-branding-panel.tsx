import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { LoginFlowVisual } from "@/components/auth/login-flow-visual";
import { LoginNetworkPattern } from "@/components/auth/login-network-pattern";
import { loginTheme } from "@/components/auth/login-theme";
import { Logo } from "@/components/shared/logo";

function TrustCheck({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-[15px] leading-snug text-[#64748B]">
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: loginTheme.greenBadgeBg,
          color: loginTheme.greenBadgeText,
        }}
        aria-hidden
      >
        <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
          <path
            d="M2 5.2 4.1 7.3 8 3.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {children}
    </li>
  );
}

export async function LoginBrandingPanel() {
  const t = await getTranslations("auth.branding");

  const trustIndicators = [t("trust1"), t("trust2"), t("trust3")] as const;

  return (
    <div
      className="relative flex h-full min-h-svh flex-col overflow-hidden border-r"
      style={{
        backgroundColor: loginTheme.bgLeft,
        borderColor: loginTheme.panelDivider,
      }}
    >
      <LoginNetworkPattern />

      <div className="relative z-10 shrink-0 px-6 pt-8 sm:px-10 lg:px-14 lg:pt-10 xl:px-16">
        <Logo />
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-12 sm:px-10 sm:pb-14 lg:px-14 lg:pb-16 xl:px-16">
        <span
          className="inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em]"
          style={{
            backgroundColor: loginTheme.greenBadgeBg,
            borderColor: loginTheme.greenBadgeBorder,
            color: loginTheme.greenBadgeText,
          }}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: loginTheme.greenHover }}
            aria-hidden
          />
          {t("badge")}
        </span>

        <h1
          className="mt-5 max-w-xl font-heading text-[clamp(1.875rem,3.2vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.03em] sm:mt-6"
          style={{ color: loginTheme.textPrimary }}
        >
          <span className="block">{t("titleLine1")}</span>
          <span className="block">{t("titleLine2")}</span>
        </h1>

        <p
          className="mt-4 max-w-md text-[17px] leading-relaxed"
          style={{ color: loginTheme.textSecondary }}
        >
          {t("description")}
        </p>

        <LoginFlowVisual />

        <ul className="mt-6 flex flex-col gap-3">
          {trustIndicators.map((item) => (
            <TrustCheck key={item}>{item}</TrustCheck>
          ))}
        </ul>
      </div>
    </div>
  );
}
