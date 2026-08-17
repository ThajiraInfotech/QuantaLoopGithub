"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { CityCombobox } from "@/components/onboarding/city-combobox";
import { INDIAN_LOCATIONS_SORTED, getStateByCode } from "@/constants/indian-locations";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  type LocationDraft,
  emptyLocationDraft,
  isLocationDraftComplete,
} from "@/lib/location-profile";

type GeographySelectionProps = {
  value: LocationDraft;
  onChange: (draft: LocationDraft) => void;
};

export function GeographySelection({ value, onChange }: GeographySelectionProps) {
  const t = useTranslations("onboarding.location");
  const [cityError, setCityError] = useState<string | null>(null);

  function update(patch: Partial<LocationDraft>) {
    onChange({ ...value, ...patch });
  }

  function handleStateChange(stateCode: string) {
    setCityError(null);
    if (!stateCode) {
      onChange({ ...emptyLocationDraft(), country: value.country || "IN" });
      return;
    }
    const state = getStateByCode(stateCode);
    onChange({
      ...value,
      stateCode,
      state: state?.name ?? "",
      region: "",
      customRegion: "",
      // Clear city on state change so the next selection is unambiguous.
      city: "",
      country: value.country || "IN",
    });
  }

  function handleCityChange(city: string) {
    setCityError(null);
    update({ city });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="geo-state">
          {t("stateLabel")}{" "}
          <span className="font-normal text-zinc-500">{t("required")}</span>
        </Label>
        <Select
          id="geo-state"
          value={value.stateCode}
          onChange={(e) => handleStateChange(e.target.value)}
          className="border-zinc-200 bg-white"
        >
          <option value="">{t("selectState")}</option>
          {INDIAN_LOCATIONS_SORTED.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </Select>
      </div>

      <CityCombobox
        stateCode={value.stateCode}
        value={value.city}
        onChange={handleCityChange}
        disabled={!value.stateCode}
        error={cityError}
        onErrorChange={setCityError}
      />
    </div>
  );
}

export { isLocationDraftComplete };
