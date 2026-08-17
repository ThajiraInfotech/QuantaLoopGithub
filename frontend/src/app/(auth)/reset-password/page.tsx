import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.resetPassword");
  return { title: t("title") };
}

async function ResetPasswordFallback() {
  const t = await getTranslations("auth.resetPassword");
  return <p className="text-sm text-[#64748B]">{t("loading")}</p>;
}

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth.resetPassword");

  return (
    <AuthCardShell title={t("title")} description={t("description")}>
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCardShell>
  );
}
