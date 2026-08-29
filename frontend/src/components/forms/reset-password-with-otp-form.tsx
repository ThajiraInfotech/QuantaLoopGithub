"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { OtpCodeInput } from "@/components/auth/otp-code-input";
import {
  loginButtonClass,
  loginErrorClass,
  loginInputClass,
  loginLabelClass,
  loginLinkClass,
} from "@/components/auth/login-theme";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ROUTES } from "@/constants/routes";
import {
  forgotPasswordRequest,
  resetPasswordRequest,
} from "@/services/auth/auth.service";
import {
  createResetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/validations/auth";

type ResetPasswordWithOtpFormProps = {
  email: string;
  otpSentTo?: string;
  onChangeEmail?: () => void;
};

export function ResetPasswordWithOtpForm({
  email,
  otpSentTo,
  onChangeEmail,
}: ResetPasswordWithOtpFormProps) {
  const router = useRouter();
  const t = useTranslations("auth.resetPassword");
  const tValidation = useTranslations("validation");

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const resetPasswordSchema = useMemo(
    () =>
      createResetPasswordSchema({
        passwordMin: tValidation("passwordMin"),
        passwordMax: tValidation("passwordMax"),
        confirmPassword: tValidation("confirmPassword"),
        passwordsMismatch: tValidation("passwordsMismatch"),
        otpInvalid: t("otpInvalid"),
      }),
    [t, tValidation]
  );

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { code: "", password: "", confirmPassword: "" },
  });

  const { errors, isSubmitted, touchedFields, isSubmitting } = form.formState;

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null);
    try {
      const result = await resetPasswordRequest({ ...values, email });
      setSuccessMessage(result.message);
      window.setTimeout(() => {
        router.replace(ROUTES.login);
      }, 1800);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t("resetFailed"));
    }
  }

  async function handleResend() {
    setResending(true);
    setFormError(null);
    try {
      await forgotPasswordRequest({ email });
      setResent(true);
      form.setValue("code", "");
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : "Unable to resend the code."
      );
    } finally {
      setResending(false);
    }
  }

  const showCodeError =
    Boolean(errors.code?.message) && (touchedFields.code || isSubmitted);
  const showPasswordError =
    Boolean(errors.password?.message) &&
    (touchedFields.password || isSubmitted);
  const showConfirmError =
    Boolean(errors.confirmPassword?.message) &&
    (touchedFields.confirmPassword || isSubmitted);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div
        className="rounded-xl border px-4 py-3 text-sm"
        style={{
          borderColor: "#D8E2EA",
          backgroundColor: "#F8FAFB",
          color: "#334155",
        }}
      >
        <p>
          {t("codeSentTo")}{" "}
          <span className="font-medium text-[#0F172A]">
            {otpSentTo || email}
          </span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#64748B]">
          {t("autofillHint")}
        </p>
        {onChangeEmail ? (
          <button
            type="button"
            onClick={onChangeEmail}
            className={`${loginLinkClass} mt-1`}
          >
            {t("useDifferentEmail")}
          </button>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-otp" className={loginLabelClass}>
          {t("otpLabel")}
        </Label>
        <Controller
          name="code"
          control={form.control}
          render={({ field }) => (
            <OtpCodeInput
              id="reset-otp"
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting || Boolean(successMessage)}
              error={showCodeError}
            />
          )}
        />
        {showCodeError ? (
          <p className={loginErrorClass} role="alert">
            {errors.code?.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className={loginLabelClass}>
          {t("newPassword")}
        </Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          disabled={isSubmitting || Boolean(successMessage)}
          inputClassName={loginInputClass}
          {...form.register("password")}
        />
        {showPasswordError ? (
          <p className={loginErrorClass} role="alert">
            {errors.password?.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className={loginLabelClass}>
          {t("confirmPassword")}
        </Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          disabled={isSubmitting || Boolean(successMessage)}
          inputClassName={loginInputClass}
          {...form.register("confirmPassword")}
        />
        {showConfirmError ? (
          <p className={loginErrorClass} role="alert">
            {errors.confirmPassword?.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p className={loginErrorClass} role="alert">
          {formError}
        </p>
      ) : null}

      {successMessage ? (
        <p
          className="rounded-xl border px-4 py-3 text-[14px] leading-relaxed"
          style={{
            borderColor: "#B5E8D0",
            backgroundColor: "#F7FCF9",
            color: "#0F172A",
          }}
          role="status"
        >
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        className={loginButtonClass}
        disabled={isSubmitting || Boolean(successMessage)}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? t("updatingPassword") : t("updatePassword")}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resending || resent || Boolean(successMessage)}
          className={loginLinkClass}
        >
          {resending
            ? t("resendingCode")
            : resent
              ? t("codeResent")
              : t("resendCode")}
        </button>
        <Link href={ROUTES.login} className={loginLinkClass}>
          {t("backToSignIn")}
        </Link>
      </div>
    </form>
  );
}
