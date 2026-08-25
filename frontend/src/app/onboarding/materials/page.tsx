"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { MaterialsSelection } from "@/components/onboarding/materials-selection";
import { OnboardingActions } from "@/components/onboarding/onboarding-actions";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { ROUTES } from "@/constants/routes";
import { useRequireOnboardingRole } from "@/hooks/use-require-onboarding-role";
import { useOnboardingStore } from "@/store/onboarding-store";

function MaterialsOnboardingContent() {
  const router = useRouter();
  const t = useTranslations("onboarding.materials");
  const tCommon = useTranslations("common.roles");
  useRequireOnboardingRole();
  const pendingSignupRole = useOnboardingStore((s) => s.pendingSignupRole);
  const draftMaterials = useOnboardingStore((s) => s.draftMaterials);
  const setDraftMaterials = useOnboardingStore((s) => s.setDraftMaterials);

  const [selected, setSelected] = useState<string[]>(draftMaterials);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isBuyer = pendingSignupRole === "verified_buyer";
  const roleLabel = pendingSignupRole ? tCommon(pendingSignupRole) : "";
  const pageTitle = isBuyer ? t("buyerTitle") : t("providerTitle");
  const pageDescription = isBuyer ? t("buyerDescription") : t("providerDescription");

  async function saveAndContinue(materials: string[]) {
    if (materials.length === 0) {
      setError(t("minOneCategory"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      setDraftMaterials(materials);
      router.push(ROUTES.onboardingLocation);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("unableToContinue"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingShell
      activeStep={2}
      title={pageTitle}
      description={pageDescription}
      maxWidth="xl"
    >
      {roleLabel ? (
        <p className="inline-flex w-fit rounded-full border border-[#CFEFDF] bg-[#F7FCF9] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#33B573]">
          {roleLabel}
        </p>
      ) : null}

      <MaterialsSelection
        selected={selected}
        onChange={setSelected}
        label={t("fieldLabel")}
        description={t("fieldHint")}
      />

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <OnboardingActions
        submitting={submitting}
        continueDisabled={selected.length === 0}
        onContinue={() => void saveAndContinue(selected)}
        continueLabel={t("continueToLocation")}
        profileLink={ROUTES.profile}
      />
    </OnboardingShell>
  );
}

export default function OnboardingMaterialsPage() {
  return <MaterialsOnboardingContent />;
}
