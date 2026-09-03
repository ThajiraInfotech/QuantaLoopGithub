"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  loginButtonClass,
  loginErrorClass,
  loginInputClass,
  loginLabelClass,
} from "@/components/auth/login-theme";
import { ResetPasswordWithOtpForm } from "@/components/forms/reset-password-with-otp-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordRequest,
  type AuthRequestError,
} from "@/services/auth/auth.service";
import {
  createForgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/validations/auth";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const forgotPasswordSchema = useMemo(
    () =>
      createForgotPasswordSchema({
        email: tValidation("email"),
      }),
    [tValidation]
  );

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: "" },
  });

  const { errors, isSubmitted, touchedFields, isSubmitting } = form.formState;
  const showEmailError =
    Boolean(errors.email?.message) && (touchedFields.email || isSubmitted);

  async function onSubmit(values: ForgotPasswordFormValues) {
    setSending(true);
    setFormError(null);
    try {
      const result = await forgotPasswordRequest(values);
      const accountEmail = values.email.trim().toLowerCase();
      setSubmittedEmail(accountEmail);
      setOtpSentTo(result.otpSentTo || accountEmail);
    } catch (e) {
      const err = e as AuthRequestError;
      setFormError(
        err.code === "USER_NOT_FOUND"
          ? t("accountNotFound")
          : err instanceof Error
            ? err.message
            : t("requestFailed")
      );
    } finally {
      setSending(false);
    }
  }

  const isBusy = sending || isSubmitting;

  if (submittedEmail) {
    return (
      <ResetPasswordWithOtpForm
        email={submittedEmail}
        otpSentTo={otpSentTo || undefined}
        onChangeEmail={() => {
          setSubmittedEmail(null);
          setOtpSentTo(null);
          setFormError(null);
          form.reset({ email: submittedEmail });
        }}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email" className={loginLabelClass}>
          {tCommon("email")}
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          disabled={isBusy}
          className={loginInputClass}
          {...form.register("email")}
        />
        {showEmailError ? (
          <p className={loginErrorClass} role="alert">
            {errors.email?.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p className={loginErrorClass} role="alert">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        className={`${loginButtonClass} gap-2`}
        disabled={isBusy}
        aria-busy={isBusy}
      >
        {isBusy ? (
          <>
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
            {t("sendingCode")}
          </>
        ) : (
          t("sendCode")
        )}
      </button>
    </form>
  );
}
