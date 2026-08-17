import { ROUTES } from "@/constants/routes";
import { getSubscriptionAccessState } from "@/services/subscriptions/subscription.service";
import type { User } from "@/types/user";

function isGoogleOnlyAccount(user: User): boolean {
  if (user.hasLocalPassword === false) return true;
  return user.authProvider === "google" && user.hasLocalPassword !== true;
}

/**
 * Google accounts are already email-verified by Google — never force OTP.
 * Manual email/password signups must verify OTP before app access.
 */
export function userNeedsEmailOtp(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.authProvider === "google" || user.googleEmailVerified) {
    return false;
  }
  return user.emailVerified === false;
}

/** Google accounts that still have no password to sign in with. */
export function userNeedsAccountSetup(user: User): boolean {
  if (user.role === "admin") return false;
  return isGoogleOnlyAccount(user);
}

/**
 * The single rule for where a signed-in user belongs. Role, materials, and
 * location are collected before the account exists, so an account that exists
 * is never sent back through onboarding — only email verification, account
 * setup, and membership can still stand between the user and the dashboard.
 */
export async function getPostAuthRedirect(user: User): Promise<string> {
  if (userNeedsEmailOtp(user)) return ROUTES.verifyEmail;
  if (user.role === "admin") return ROUTES.admin;
  if (userNeedsAccountSetup(user)) return ROUTES.onboardingAccount;

  try {
    const access = await getSubscriptionAccessState();
    return access.entitled ? ROUTES.dashboard : ROUTES.onboardingMembership;
  } catch {
    // Fail closed: the membership page can retry the canonical check.
    return ROUTES.onboardingMembership;
  }
}

export const REMEMBER_EMAIL_KEY = "ql-remember-email";

export function loadRememberedEmail(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(REMEMBER_EMAIL_KEY) ?? "";
}

export function persistRememberedEmail(email: string, remember: boolean) {
  if (typeof window === "undefined") return;
  if (remember) {
    window.localStorage.setItem(REMEMBER_EMAIL_KEY, email);
  } else {
    window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
  }
}
