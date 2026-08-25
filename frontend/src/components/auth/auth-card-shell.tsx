import type { ReactNode } from "react";

import { LoginBrandingPanel } from "@/components/auth/login-branding-panel";
import { loginTheme } from "@/components/auth/login-theme";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Logo } from "@/components/shared/logo";

type AuthCardShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export async function AuthCardShell({
  title,
  description,
  children,
}: AuthCardShellProps) {
  return (
    <div className="grid min-h-svh overflow-x-hidden lg:grid-cols-2">
      <div className="hidden min-h-svh lg:block">
        <LoginBrandingPanel />
      </div>

      <div
        className="flex min-h-svh items-start justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:items-center sm:px-8 sm:py-12 lg:px-14 lg:py-16 xl:px-16"
        style={{ backgroundColor: loginTheme.bgRight }}
      >
        <div
          className="w-full max-w-[480px] rounded-2xl border p-5 sm:rounded-3xl sm:p-8 lg:p-10"
          style={{
            backgroundColor: loginTheme.card,
            borderColor: loginTheme.border,
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div className="mb-5 flex items-center justify-between gap-3 sm:mb-4">
            <div className="lg:hidden">
              <Logo className="h-8" />
            </div>
            <div className="ml-auto">
              <LanguageSwitcher compact />
            </div>
          </div>
          <div className="space-y-2.5">
            <h2
              className="font-heading text-[1.5rem] font-bold tracking-[-0.02em] text-balance sm:text-[clamp(1.75rem,2.4vw,2rem)]"
              style={{ color: loginTheme.textPrimary }}
            >
              {title}
            </h2>
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: loginTheme.textSecondary }}
            >
              {description}
            </p>
          </div>

          <div className="mt-5 sm:mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
