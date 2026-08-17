"use client";

import { CheckCircle2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  loginButtonClass,
  loginErrorClass,
  loginInputClass,
  loginLabelClass,
  loginLinkClass,
  loginTheme,
} from "@/components/auth/login-theme";
import { getPostAuthRedirect, userNeedsEmailOtp } from "@/lib/auth-routing";
import { flushOnboardingDraftToProfile } from "@/lib/onboarding-flush";
import { ROUTES } from "@/constants/routes";
import {
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
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Google / already-verified users should never stay on OTP.
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

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(trimmed)) {
      setStatus("error");
      setMessage(t("codeInvalid"));
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const result = await verifyEmailRequest(trimmed);
      setStatus("success");
      setMessage(result.message);
      if (result.user) {
        syncUser(result.user);
      }

      // If register cleared navigation before profile flush finished, finish it now.
      try {
        const flushed = await flushOnboardingDraftToProfile();
        const currentUserId = useAuthStore.getState().user?.id;
        if (flushed && currentUserId && currentUserId === (result.user?.id ?? user?.id)) {
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
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("verifyError"));
    }
  }

  async function handleResend() {
    setResending(true);
    setMessage(null);
    try {
      const result = await resendVerificationRequest(
        user?.email ? { email: user.email } : undefined
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

  async function abandonVerification(destination: string) {
    setCancelling(true);
    try {
      await logoutRequest();
    } catch {
      /* cookie clear is best-effort */
    } finally {
      clearSession();
      router.replace(destination);
    }
  }

  if (status === "success") {
    return (
      <div
        className="space-y-4 rounded-2xl border px-5 py-6"
        style={{
          borderColor: loginTheme.greenBadgeBorder,
          backgroundColor: loginTheme.greenBadgeBg,
        }}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#22B573]" />
          <div>
            <h3 className="text-base font-semibold text-[#0F172A]">
              {t("verifiedTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
              {message ?? t("verifiedFallback")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl border px-5 py-6"
        style={{
          borderColor: loginTheme.border,
          backgroundColor: "#FFFFFF",
        }}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B]">
            <Mail className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-[#0F172A]">
              {t("idleTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
              {t("sentPrefix")}{" "}
              <span className="font-medium text-[#0F172A]">
                {user?.email ?? t("emailFallback")}
              </span>
              {t("sentSuffix")}
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-4" onSubmit={(e) => void handleVerify(e)}>
        <div className="space-y-2">
          <label htmlFor="verification-code" className={loginLabelClass}>
            {t("codeLabel")}
          </label>
          <input
            id="verification-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder={t("codePlaceholder")}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              if (status === "error") {
                setStatus("idle");
                setMessage(null);
              }
            }}
            className={`${loginInputClass} tracking-[0.35em] text-center text-lg font-semibold`}
            disabled={status === "loading"}
            aria-invalid={status === "error"}
          />
        </div>

        {status === "error" && message ? (
          <p className={loginErrorClass} role="alert">
            {message}
          </p>
        ) : null}

        {status !== "error" && message ? (
          <p className="text-sm leading-relaxed text-[#64748B]">{message}</p>
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
        className="flex h-[48px] w-full items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[15px] font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22B573]/20 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={resending || status === "loading"}
        onClick={() => void handleResend()}
      >
        {resending ? t("resending") : t("resend")}
      </button>

      <div className="flex flex-col items-center gap-2 text-center text-sm">
        <button
          type="button"
          className={loginLinkClass}
          disabled={cancelling}
          onClick={() => void abandonVerification(ROUTES.register)}
        >
          {cancelling ? t("cancelling") : t("cancelSignup")}
        </button>
        <button
          type="button"
          className="text-sm font-medium text-[#64748B] underline-offset-4 transition-colors hover:text-[#0F172A] hover:underline disabled:opacity-50"
          disabled={cancelling}
          onClick={() => void abandonVerification(ROUTES.login)}
        >
          {t("backToSignIn")}
        </button>
      </div>
    </div>
  );
}
