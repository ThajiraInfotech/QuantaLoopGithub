"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { CountrySelectField } from "@/components/onboarding/country-select-field";
import {
  GeographySelection,
  isLocationDraftComplete,
} from "@/components/onboarding/geography-selection";
import { OnboardingActions } from "@/components/onboarding/onboarding-actions";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import {
  INDIA_COUNTRY_CODE,
  isIndiaCountry,
  normalizeCountryCode,
} from "@/constants/countries";
import { ROUTES } from "@/constants/routes";
import { useRequireOnboardingRole } from "@/hooks/use-require-onboarding-role";
import {
  type LocationDraft,
  emptyLocationDraft,
  getLocationDraftError,
} from "@/lib/location-profile";
import {
  normalizeLocationDraft,
  useOnboardingStore,
} from "@/store/onboarding-store";

function LocationOnboardingContent() {
  const router = useRouter();
  const t = useTranslations("onboarding.location");
  const tMaterials = useTranslations("onboarding.materials");
  useRequireOnboardingRole({ materials: true });
  const draftLocationRaw = useOnboardingStore((s) => s.draftLocation);
  const setDraftLocation = useOnboardingStore((s) => s.setDraftLocation);

  const [locationDraft, setLocationDraft] = useState<LocationDraft>(() =>
    normalizeLocationDraft(draftLocationRaw)
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    return getLocationDraftError(locationDraft);
  }

  function handleCountryChange(countryCode: string) {
    const country = normalizeCountryCode(countryCode);
    if (isIndiaCountry(country)) {
      setLocationDraft({
        ...emptyLocationDraft(),
        country: INDIA_COUNTRY_CODE,
        stateCode: locationDraft.stateCode,
        state: locationDraft.state,
        city: locationDraft.city,
      });
      return;
    }
    setLocationDraft({
      ...emptyLocationDraft(),
      country,
    });
  }

  async function handleContinue() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      setDraftLocation(locationDraft);
      router.push(ROUTES.onboardingAccount);
    } catch (e) {
      setError(e instanceof Error ? e.message : tMaterials("unableToContinue"));
    } finally {
      setSubmitting(false);
    }
  }

  const indiaSelected = isIndiaCountry(locationDraft.country);

  return (
    <OnboardingShell
      activeStep={3}
      title={t("title")}
      description={t("description")}
    >
      <CountrySelectField
        value={locationDraft.country || INDIA_COUNTRY_CODE}
        onChange={handleCountryChange}
        label="Country"
        hint="Indian users keep city and state proximity. Abroad users select country only."
      />

      {indiaSelected ? (
        <GeographySelection value={locationDraft} onChange={setLocationDraft} />
      ) : (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm leading-relaxed text-pretty text-zinc-600">
          Abroad accounts use country-level matching only — no city or state
          proximity.
        </p>
      )}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <OnboardingActions
        submitting={submitting}
        continueDisabled={!isLocationDraftComplete(locationDraft)}
        onContinue={() => void handleContinue()}
        continueLabel={t("continue")}
        profileLink={ROUTES.profile}
      />
    </OnboardingShell>
  );
}

export default function OnboardingLocationPage() {
  return <LocationOnboardingContent />;
}
