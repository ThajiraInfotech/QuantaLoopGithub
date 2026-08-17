"use client";

import { useRouter } from "next/navigation";

import {
  getPostAuthRedirect,
  persistRememberedEmail,
} from "@/lib/auth-routing";
import { ROUTES } from "@/constants/routes";
import {
  googleAuthRequest,
  type AuthRequestError,
} from "@/services/auth/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { useOnboardingStore } from "@/store/onboarding-store";

export function useGoogleAuth() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const setPendingSignupEmail = useOnboardingStore(
    (s) => s.setPendingSignupEmail
  );

  async function signInWithGoogle(
    credential: string,
    options?: { rememberMe?: boolean }
  ) {
    try {
      const data = await googleAuthRequest({
        credential,
        rememberMe: options?.rememberMe,
        mode: "login",
      });

      if (options?.rememberMe && data.user.email) {
        persistRememberedEmail(data.user.email, true);
      }

      setSession({ user: data.user, accessToken: data.accessToken });

      // Google accounts are email-verified by Google — skip OTP.
      router.push(await getPostAuthRedirect(data.user));
      router.refresh();
    } catch (error) {
      const err = error as AuthRequestError;
      if (err.code === "GOOGLE_ACCOUNT_NOT_FOUND" && err.email) {
        setPendingSignupEmail(err.email);
        router.push(ROUTES.onboardingRole);
        router.refresh();
        return;
      }
      throw error;
    }
  }

  return { signInWithGoogle };
}
