"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { forgotPasswordRequest } from "@/services/auth/auth.service";
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
    setFormError(null);
    try {
      const result = await forgotPasswordRequest(values);
      const accountEmail = values.email.trim().toLowerCase();
      setSubmittedEmail(accountEmail);
      setOtpSentTo(result.otpSentTo || accountEmail);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t("requestFailed"));
    }
  }

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
          disabled={isSubmitting}
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
        className={loginButtonClass}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? t("sendingCode") : t("sendCode")}
      </button>
    </form>
  );
}
