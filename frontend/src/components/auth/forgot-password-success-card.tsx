"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  loginButtonClass,
  loginErrorClass,
  loginLinkClass,
  loginTheme,
} from "@/components/auth/login-theme";
import { ROUTES } from "@/constants/routes";
import { forgotPasswordRequest } from "@/services/auth/auth.service";

type ForgotPasswordSuccessCardProps = {
  email: string;
  message: string;
};

export function ForgotPasswordSuccessCard({
  email,
  message,
}: ForgotPasswordSuccessCardProps) {
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    setResending(true);
    setResendError(null);
    try {
      await forgotPasswordRequest({ email });
      setResent(true);
    } catch (e) {
      setResendError(
        e instanceof Error ? e.message : "Unable to resend instructions."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div
      className="space-y-5 rounded-2xl border px-5 py-6"
      style={{
        borderColor: loginTheme.greenBadgeBorder,
        backgroundColor: loginTheme.greenBadgeBg,
      }}
      role="status"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#22B573]"
          aria-hidden
        >
          <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <h3
            className="text-base font-semibold"
            style={{ color: loginTheme.textPrimary }}
          >
            Check your inbox
          </h3>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: loginTheme.textSecondary }}
          >
            {message}
          </p>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: loginTheme.textSecondary }}
          >
            If an account exists for{" "}
            <span className="font-medium text-[#0F172A]">{email}</span>, you&apos;ll
            receive reset instructions shortly.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resending || resent}
          className={loginLinkClass}
        >
          {resending ? "Resending…" : resent ? "Instructions resent" : "Resend"}
        </button>
        <Link href={ROUTES.login} className={loginLinkClass}>
          Back to Sign In
        </Link>
      </div>

      {resendError ? (
        <p className={loginErrorClass} role="alert">
          {resendError}
        </p>
      ) : null}
    </div>
  );
}
