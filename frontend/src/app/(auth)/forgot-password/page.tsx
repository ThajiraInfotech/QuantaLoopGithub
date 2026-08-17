import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.forgotPassword");
  return { title: t("title") };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPassword");

  return (
    <AuthCardShell title={t("title")} description={t("description")}>
      <ForgotPasswordForm />
    </AuthCardShell>
  );
}
