"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import {
  loginButtonClass,
  loginErrorClass,
  loginInputClass,
  loginPasswordInputClass,
  loginLabelClass,
  loginLinkClass,
  loginTheme,
} from "@/components/auth/login-theme";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  getPostAuthRedirect,
  loadRememberedEmail,
  persistRememberedEmail,
  userNeedsEmailOtp,
} from "@/lib/auth-routing";
import { ROUTES } from "@/constants/routes";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { loginRequest } from "@/services/auth/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { createLoginSchema, type LoginFormValues } from "@/validations/auth";

function AuthDivider() {
  const t = useTranslations("common");

  return (
    <div className="flex items-center gap-3">
      <span
        className="h-px flex-1"
        style={{ backgroundColor: loginTheme.border }}
        aria-hidden
      />
      <span
        className="text-[12px] font-medium uppercase tracking-[0.14em]"
        style={{ color: loginTheme.textSecondary }}
      >
        {t("or")}
      </span>
      <span
        className="h-px flex-1"
        style={{ backgroundColor: loginTheme.border }}
        aria-hidden
      />
    </div>
  );
}

type LoginFormProps = {
  googleClientId?: string;
};

export function LoginForm({ googleClientId }: LoginFormProps) {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const setSession = useAuthStore((s) => s.setSession);
  const { signInWithGoogle } = useGoogleAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const loginSchema = useMemo(
    () =>
      createLoginSchema({
        email: tValidation("email"),
        passwordRequired: tValidation("passwordRequired"),
      }),
    [tValidation]
  );

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    const rememberedEmail = loadRememberedEmail();
    if (rememberedEmail) {
      form.setValue("email", rememberedEmail);
      form.setValue("rememberMe", true);
    }
  }, [form]);

  const { errors, isSubmitted, touchedFields, isSubmitting } = form.formState;
  const rememberMe = form.watch("rememberMe");

  const showEmailError =
    Boolean(errors.email?.message) && (touchedFields.email || isSubmitted);
  const showPasswordError =
    Boolean(errors.password?.message) &&
    (touchedFields.password || isSubmitted);

  async function completeAuth(data: Awaited<ReturnType<typeof loginRequest>>) {
    setSession({ user: data.user, accessToken: data.accessToken });

    if (userNeedsEmailOtp(data.user)) {
      router.push(ROUTES.verifyEmail);
      router.refresh();
      return;
    }

    router.push(await getPostAuthRedirect(data.user));
    router.refresh();
  }

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const data = await loginRequest(values);
      persistRememberedEmail(values.email, Boolean(values.rememberMe));
      await completeAuth(data);
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : t("signInFailed")
      );
    }
  }

  async function handleGoogleSuccess(credential: string) {
    setFormError(null);
    try {
      await signInWithGoogle(credential, { rememberMe });
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : t("googleSignInFailed")
      );
    }
  }

  const isBusy = isSubmitting;

  return (
    <div className="space-y-4">
      <GoogleSignInButton
        clientId={googleClientId}
        disabled={isBusy}
        onSuccess={handleGoogleSuccess}
      />

      <AuthDivider />

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
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

        <div className="space-y-1.5">
          <Label htmlFor="password" className={loginLabelClass}>
            {tCommon("password")}
          </Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            disabled={isBusy}
            inputClassName={loginPasswordInputClass}
            {...form.register("password")}
          />
          {showPasswordError ? (
            <p className={loginErrorClass} role="alert">
              {errors.password?.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-0.5">
          <label className="flex min-h-10 items-center gap-2.5 text-sm text-[#0F172A]">
            <input
              type="checkbox"
              disabled={isBusy}
              className="h-4 w-4 rounded border-[#CBD5E1] text-[#22B573] focus:ring-[#22B573]/30"
              {...form.register("rememberMe")}
            />
            {t("rememberMe")}
          </label>
          <Link href={ROUTES.forgotPassword} className={loginLinkClass}>
            {t("forgotPassword")}
          </Link>
        </div>

        {formError ? (
          <p className={loginErrorClass} role="alert">
            {formError}
          </p>
        ) : null}

        <div className="space-y-2 pt-0.5">
          <button
            type="submit"
            className={loginButtonClass}
            disabled={isBusy}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? t("signingIn") : tCommon("signIn")}
          </button>
          <p
            className="text-center text-[13px] leading-relaxed"
            style={{ color: loginTheme.textSecondary }}
          >
            {t("secureAccess")}
          </p>
        </div>
      </form>

      <div
        className="space-y-1 border-t pt-5 text-center"
        style={{ borderColor: loginTheme.border }}
      >
        <p className="text-sm" style={{ color: loginTheme.textSecondary }}>
          {t("noAccount")}
        </p>
        <Link
          href={ROUTES.onboardingRole}
          className={`inline-flex items-center gap-1 ${loginLinkClass}`}
        >
          {t("startTrial")}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
