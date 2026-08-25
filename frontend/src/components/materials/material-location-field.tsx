"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { GeographySelection } from "@/components/onboarding/geography-selection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  type LocationDraft,
  formatLocationDraftLabel,
  getLocationDraftError,
  isLocationDraftComplete,
  isSameMaterialLocation,
  locationDraftToMaterialLocation,
  parseMaterialLocationToDraft,
} from "@/lib/location-profile";
import { cn } from "@/lib/utils";

type MaterialLocationFieldProps = {
  companyLocation: LocationDraft;
  value: string;
  onChange: (location: string) => void;
  error?: string;
};

export function MaterialLocationField({
  companyLocation,
  value,
  onChange,
  error,
}: MaterialLocationFieldProps) {
  const t = useTranslations("materials.form.locationField");
  const companyLabel = formatLocationDraftLabel(companyLocation);
  const companyMaterialLocation = locationDraftToMaterialLocation(companyLocation);

  const initialCustomDraft = useMemo(
    () => parseMaterialLocationToDraft(value, companyLocation),
    [value, companyLocation]
  );

  const [useCompanyLocation, setUseCompanyLocation] = useState(() => {
    if (!value.trim()) return true;
    if (!companyMaterialLocation) return false;
    return value.trim().toLowerCase() === companyMaterialLocation.toLowerCase();
  });

  const [customDraft, setCustomDraft] = useState<LocationDraft>(initialCustomDraft);
  const [draftError, setDraftError] = useState<string | null>(null);

  function openCustomLocation() {
    const nextDraft = value.trim()
      ? parseMaterialLocationToDraft(value, companyLocation)
      : { ...companyLocation };
    setCustomDraft(nextDraft);
    setDraftError(null);
    setUseCompanyLocation(false);
    if (isLocationDraftComplete(nextDraft)) {
      onChange(locationDraftToMaterialLocation(nextDraft));
    }
  }

  function useCompanyDefault() {
    setDraftError(null);
    setUseCompanyLocation(true);
    if (companyMaterialLocation) {
      onChange(companyMaterialLocation);
    }
  }

  function handleCustomDraftChange(next: LocationDraft) {
    setCustomDraft(next);
    setDraftError(getLocationDraftError(next));
    if (isLocationDraftComplete(next)) {
      onChange(locationDraftToMaterialLocation(next));
    }
  }

  const displayLocation = useCompanyLocation
    ? companyLabel || t("completeProfileLocation")
    : formatLocationDraftLabel(customDraft) || value;

  const locationsMatch =
    isLocationDraftComplete(companyLocation) &&
    isLocationDraftComplete(customDraft) &&
    isSameMaterialLocation(companyLocation, customDraft);

  return (
    <div className="space-y-3">
      <Label>{t("label")}</Label>
      <p className="text-xs text-zinc-500">{t("hint")}</p>

      <div
        className={cn(
          "rounded-xl border bg-white p-4 shadow-sm shadow-zinc-950/[0.03]",
          error || draftError ? "border-red-300" : "border-zinc-200/80"
        )}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <MapPin className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {useCompanyLocation ? t("companyLocation") : t("listingLocation")}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-900">{displayLocation}</p>
            {useCompanyLocation ? (
              <p className="mt-1 text-xs text-zinc-500">{t("companyMatchHint")}</p>
            ) : null}
          </div>
        </div>

        {useCompanyLocation ? (
          <Button
            type="button"
            variant="outline"
            className="mt-4 h-12 w-full sm:h-9 sm:w-auto"
            onClick={openCustomLocation}
            disabled={!isLocationDraftComplete(companyLocation)}
          >
            {t("differentLocation")}
          </Button>
        ) : (
          <div className="mt-4 space-y-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4">
            <GeographySelection value={customDraft} onChange={handleCustomDraftChange} />
            {!locationsMatch ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full px-0 text-emerald-800 hover:bg-transparent hover:text-emerald-900 sm:h-9 sm:w-auto"
                onClick={useCompanyDefault}
              >
                {t("useCompanyInstead")}
              </Button>
            ) : null}
          </div>
        )}
      </div>

      {draftError && !useCompanyLocation ? (
        <p className="text-sm text-red-600" role="alert">
          {draftError}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
