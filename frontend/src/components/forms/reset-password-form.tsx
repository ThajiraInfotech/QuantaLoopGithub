"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  loginButtonClass,
  loginLinkClass,
} from "@/components/auth/login-theme";
import { ResetPasswordWithOtpForm } from "@/components/forms/reset-password-with-otp-form";
import { ROUTES } from "@/constants/routes";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  const t = useTranslations("auth.resetPassword");

  if (!email) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#64748B]">{t("startFromForgot")}</p>
        <Link href={ROUTES.forgotPassword} className={loginButtonClass}>
          {t("requestCode")}
        </Link>
        <p className="text-center text-sm">
          <Link href={ROUTES.login} className={loginLinkClass}>
            {t("backToSignIn")}
          </Link>
        </p>
      </div>
    );
  }

  return <ResetPasswordWithOtpForm email={email} />;
}
