import type { ReactNode } from "react";

import { LoginBrandingPanel } from "@/components/auth/login-branding-panel";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { loginTheme } from "@/components/auth/login-theme";

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
    <div className="grid min-h-screen lg:grid-cols-2">
      <LoginBrandingPanel />

      <div
        className="flex min-h-screen items-center justify-center border-t px-6 py-12 sm:px-10 sm:py-14 lg:border-t-0 lg:px-14 lg:py-16 xl:px-16"
        style={{ backgroundColor: loginTheme.bgRight }}
      >
        <div
          className="w-full max-w-[480px] rounded-3xl border p-8 sm:p-10"
          style={{
            backgroundColor: loginTheme.card,
            borderColor: loginTheme.border,
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div className="mb-4 flex justify-end">
            <LanguageSwitcher compact />
          </div>
          <div className="space-y-2.5">
            <h2
              className="font-heading text-[clamp(1.75rem,2.4vw,2rem)] font-bold tracking-[-0.02em]"
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

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
