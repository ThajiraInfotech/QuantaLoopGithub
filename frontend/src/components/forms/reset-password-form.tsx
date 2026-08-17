"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

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
import { resetPasswordRequest } from "@/services/auth/auth.service";
import {
  createResetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/validations/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const t = useTranslations("auth.resetPassword");
  const tValidation = useTranslations("validation");

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetPasswordSchema = useMemo(
    () =>
      createResetPasswordSchema({
        passwordMin: tValidation("passwordMin"),
        passwordMax: tValidation("passwordMax"),
        confirmPassword: tValidation("confirmPassword"),
        passwordsMismatch: tValidation("passwordsMismatch"),
      }),
    [tValidation]
  );

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { errors, isSubmitted, touchedFields, isSubmitting } = form.formState;

  useEffect(() => {
    if (!token) {
      setFormError(t("invalidLink"));
    }
  }, [token, t]);

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token) return;

    setFormError(null);
    try {
      const result = await resetPasswordRequest({ ...values, token });
      setSuccessMessage(result.message);
      window.setTimeout(() => {
        router.replace(ROUTES.login);
      }, 1800);
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : t("resetFailed")
      );
    }
  }

  const showPasswordError =
    Boolean(errors.password?.message) &&
    (touchedFields.password || isSubmitted);
  const showConfirmError =
    Boolean(errors.confirmPassword?.message) &&
    (touchedFields.confirmPassword || isSubmitted);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password" className={loginLabelClass}>
          {t("newPassword")}
        </Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          disabled={isSubmitting || Boolean(successMessage) || !token}
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
          disabled={isSubmitting || Boolean(successMessage) || !token}
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
        disabled={isSubmitting || Boolean(successMessage) || !token}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? t("updatingPassword") : t("updatePassword")}
      </button>

      <p className="text-center text-sm">
        <Link href={ROUTES.login} className={loginLinkClass}>
          {t("backToSignIn")}
        </Link>
      </p>
    </form>
  );
}
