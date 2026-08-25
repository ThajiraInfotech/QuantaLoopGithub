"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  loginButtonClass,
  loginErrorClass,
  loginLabelClass,
  loginLinkClass,
} from "@/components/auth/login-theme";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { ROUTES } from "@/constants/routes";
import { useInterceptBrowserBack } from "@/hooks/use-intercept-browser-back";
import { getPostAuthRedirect, userNeedsEmailOtp } from "@/lib/auth-routing";
import { flushOnboardingDraftToProfile } from "@/lib/onboarding-flush";
import { cn } from "@/lib/utils";
import {
  cancelSignupRequest,
  logoutRequest,
  resendVerificationRequest,
  verifyEmailRequest,
} from "@/services/auth/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useProfileTrustStore } from "@/store/profile-trust-store";

export function VerifyEmailPanel() {
  const t = useTranslations("auth.verifyEmail");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const syncUser = useAuthStore((s) => s.syncUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const clearOnboardingDraft = useOnboardingStore((s) => s.clearOnboardingDraft);
  const setTrustSignals = useProfileTrustStore((s) => s.setTrustSignals);

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const verifyingRef = useRef(false);
  const abandoningRef = useRef(false);
  const needsOtp = Boolean(user && accessToken && userNeedsEmailOtp(user));

  useInterceptBrowserBack(
    needsOtp && status !== "success" && status !== "loading" && !cancelling,
    () => {
      void abandonVerification(ROUTES.onboardingRole, true);
    }
  );

  useEffect(() => {
    if (!user) return;
    if (!userNeedsEmailOtp(user)) {
      let cancelled = false;
      void getPostAuthRedirect(user).then((destination) => {
        if (!cancelled) router.replace(destination);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [user, router]);

  async function verifyCode(rawCode: string) {
    const trimmed = rawCode.replace(/\s/g, "");
    if (!/^\d{6}$/.test(trimmed)) {
      setStatus("error");
      setMessage(t("codeInvalid"));
      return;
    }
    if (verifyingRef.current) return;

    verifyingRef.current = true;
    setStatus("loading");
    setMessage(null);

    try {
      const result = await verifyEmailRequest(trimmed);
      setStatus("success");
      setMessage(result.message);
      if (result.user) {
        syncUser(result.user);
      }

      try {
        const flushed = await flushOnboardingDraftToProfile();
        const currentUserId = useAuthStore.getState().user?.id;
        if (
          flushed &&
          currentUserId &&
          currentUserId === (result.user?.id ?? user?.id)
        ) {
          syncUser({
            ...flushed.profile,
            emailVerified: true,
            authProvider: result.user?.authProvider,
            googleEmailVerified: result.user?.googleEmailVerified,
          });
          setTrustSignals(flushed.trustSignals);
          clearOnboardingDraft();
        }
      } catch {
        /* best-effort — location may already be on the account from register */
      }

      window.setTimeout(async () => {
        const latestUser = useAuthStore.getState().user ?? result.user;
        if (accessToken && latestUser) {
          router.replace(await getPostAuthRedirect(latestUser));
        } else {
          router.replace(ROUTES.login);
        }
        router.refresh();
      }, 1200);
    } catch (err) {
      verifyingRef.current = false;
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("verifyError"));
    }
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    void verifyCode(code);
  }

  function handleCodeChange(next: string) {
    setCode(next);
    if (status === "error") {
      setStatus("idle");
      setMessage(null);
    }
    if (next.length === 6 && status !== "loading") {
      void verifyCode(next);
    }
  }

  async function handleResend() {
    setResending(true);
    setMessage(null);
    try {
      const result = await resendVerificationRequest(
        user?.email ? { email: user.email } : undefined,
      );
      setMessage(result.message);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("resendError"));
    } finally {
      setResending(false);
    }
  }

  async function abandonVerification(
    destination: string,
    discardAccount: boolean
  ) {
    if (abandoningRef.current) return;
    abandoningRef.current = true;
    setCancelling(true);
    try {
      if (discardAccount) {
        await cancelSignupRequest();
      } else {
        await logoutRequest();
      }
    } catch {
      try {
        await logoutRequest();
      } catch {
        /* cookie clear is best-effort */
      }
    } finally {
      clearSession();
      if (discardAccount) clearOnboardingDraft();
      router.replace(destination);
      router.refresh();
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-[#B5E8D0] bg-[#DFF5EA] px-4 py-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#22B573]" />
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-zinc-900">
              {t("verifiedTitle")}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
              {message ?? t("verifiedFallback")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-zinc-600">
        {t("sentPrefix")}{" "}
        <span className="break-all font-medium text-zinc-900">
          {user?.email ?? t("emailFallback")}
        </span>
        <span className="hidden sm:inline">{t("sentSuffix")}</span>
      </p>

      <form className="space-y-4" onSubmit={handleVerify} noValidate>
        <div className="space-y-2">
          <label htmlFor="verification-code" className={loginLabelClass}>
            {t("codeLabel")}
          </label>
          <OtpCodeInput
            id="verification-code"
            value={code}
            onChange={handleCodeChange}
            disabled={status === "loading"}
            error={status === "error"}
            placeholder={t("codePlaceholder")}
          />
        </div>

        {status === "error" && message ? (
          <p className={loginErrorClass} role="alert">
            {message}
          </p>
        ) : null}

        {status !== "error" && message ? (
          <p className="text-sm leading-relaxed text-zinc-600">{message}</p>
        ) : null}

        <button
          type="submit"
          className={loginButtonClass}
          disabled={status === "loading" || code.length !== 6}
        >
          {status === "loading" ? t("verifying") : t("verify")}
        </button>
      </form>

      <button
        type="button"
        className="flex h-12 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22B573]/20 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={resending || status === "loading"}
        onClick={() => void handleResend()}
      >
        {resending ? t("resending") : t("resend")}
      </button>

      <div className="flex flex-col items-center pt-1 text-center">
        <button
          type="button"
          className={cn(loginLinkClass, "min-h-11 w-full px-3 py-2")}
          disabled={cancelling}
          onClick={() => void abandonVerification(ROUTES.onboardingRole, true)}
        >
          {cancelling ? t("cancelling") : t("cancelSignup")}
        </button>
        <button
          type="button"
          className="min-h-11 w-full px-3 py-2 text-sm font-medium text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline disabled:opacity-50"
          disabled={cancelling}
          onClick={() => void abandonVerification(ROUTES.login, false)}
        >
          {t("backToSignIn")}
        </button>
      </div>
    </div>
  );
}
