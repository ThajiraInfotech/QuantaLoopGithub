import {
  INDIAN_LOCATIONS,
  OTHER_REGION,
} from "@/constants/indian-locations";
import {
  INDIA_COUNTRY_CODE,
  countryNameFromCode,
  isIndiaCountry,
  normalizeCountryCode,
} from "@/constants/countries";
import type { ProfilePatchInput } from "@/validations/profile";
import { resolveCityForState } from "@/constants/indian-state-cities";

export type LocationDraft = {
  country: string;
  stateCode: string;
  state: string;
  region: string;
  customRegion: string;
  city: string;
};

export const emptyLocationDraft = (): LocationDraft => ({
  country: INDIA_COUNTRY_CODE,
  stateCode: "",
  state: "",
  region: "",
  customRegion: "",
  city: "",
});

export function userToLocationDraft(user: {
  country?: string;
  stateCode?: string;
  state?: string;
  city?: string;
  location?: string;
} | null): LocationDraft {
  if (!user) return emptyLocationDraft();

  const country = normalizeCountryCode(user.country);
  const stateCode = user.stateCode?.trim() ?? "";
  const state = user.state?.trim() ?? "";
  const cityFromProfile = user.city?.trim() || user.location?.trim() || "";

  if (!isIndiaCountry(country)) {
    return {
      country,
      stateCode: "",
      state: "",
      region: "",
      customRegion: "",
      city: "",
    };
  }

  if (stateCode && state) {
    const city = cityFromProfile
      ? resolveCityForState(stateCode, cityFromProfile) ?? cityFromProfile
      : "";
    return {
      country: INDIA_COUNTRY_CODE,
      stateCode,
      state,
      region: "",
      customRegion: "",
      city,
    };
  }

  if (state && cityFromProfile) {
    const matched = INDIAN_LOCATIONS.find(
      (entry) => entry.name.toLowerCase() === state.toLowerCase()
    );
    if (matched) {
      return {
        country: INDIA_COUNTRY_CODE,
        stateCode: matched.code,
        state: matched.name,
        region: "",
        customRegion: "",
        city: resolveCityForState(matched.code, cityFromProfile) ?? cityFromProfile,
      };
    }
  }

  return {
    ...parseLegacyLocationDraft("", cityFromProfile),
    country: INDIA_COUNTRY_CODE,
  };
}

export function formatLocationDraftLabel(draft: LocationDraft): string {
  if (!isIndiaCountry(draft.country)) {
    return countryNameFromCode(draft.country);
  }
  const state = draft.state.trim();
  const city = draft.city.trim();
  if (state && city) return `${state} · ${city}`;
  if (state) return state;
  return city;
}

/** Canonical listing location for matching: "City, State" (India) or country name. */
export function locationDraftToMaterialLocation(draft: LocationDraft): string {
  if (!isIndiaCountry(draft.country)) {
    return countryNameFromCode(draft.country);
  }
  const city = (resolveCityForState(draft.stateCode, draft.city) ?? draft.city).trim();
  const state = draft.state.trim();
  if (city && state) return `${city}, ${state}`;
  return city || state;
}

export function parseMaterialLocationToDraft(
  location: string,
  fallback?: LocationDraft
): LocationDraft {
  const raw = location.trim();
  if (!raw) return fallback ? { ...fallback } : emptyLocationDraft();

  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const city = parts[0];
    const stateName = parts[parts.length - 1];
    const matched = INDIAN_LOCATIONS.find(
      (entry) => entry.name.toLowerCase() === stateName.toLowerCase()
    );
    if (matched) {
      return {
        country: INDIA_COUNTRY_CODE,
        stateCode: matched.code,
        state: matched.name,
        region: "",
        customRegion: "",
        city: resolveCityForState(matched.code, city) ?? city,
      };
    }
  }

  if (fallback?.stateCode) {
    const city = resolveCityForState(fallback.stateCode, parts[0]) ?? parts[0];
    return { ...fallback, country: fallback.country || INDIA_COUNTRY_CODE, city };
  }

  return {
    ...emptyLocationDraft(),
    country: fallback?.country || INDIA_COUNTRY_CODE,
    city: parts[0] ?? "",
  };
}

export function isSameMaterialLocation(
  left: LocationDraft,
  right: LocationDraft
): boolean {
  return (
    locationDraftToMaterialLocation(left).toLowerCase() ===
    locationDraftToMaterialLocation(right).toLowerCase()
  );
}

export function resolveRegionLabel(draft: LocationDraft): string {
  if (draft.region === OTHER_REGION) {
    return draft.customRegion.trim();
  }
  return draft.region.trim();
}

export function buildOperationalLocationLabel(draft: LocationDraft): string {
  if (!isIndiaCountry(draft.country)) {
    return countryNameFromCode(draft.country);
  }
  const regionLabel = resolveRegionLabel(draft);
  if (!draft.state.trim() || !regionLabel) {
    const city = draft.city.trim();
    const state = draft.state.trim();
    if (state && city) return `${state} · ${city}`;
    return state || city;
  }
  return `${draft.state.trim()} · ${regionLabel}`;
}

export function locationDraftToPatch(draft: LocationDraft): ProfilePatchInput {
  const country = normalizeCountryCode(draft.country);

  if (!isIndiaCountry(country)) {
    const name = countryNameFromCode(country);
    return {
      country,
      stateCode: "",
      state: "",
      region: "",
      customRegion: "",
      city: name,
      operationalLocation: name,
      location: name,
    };
  }

  const resolved =
    resolveCityForState(draft.stateCode, draft.city) ?? draft.city.trim();
  const city = resolved;
  const state = draft.state.trim();

  return {
    country: INDIA_COUNTRY_CODE,
    stateCode: draft.stateCode,
    state,
    region: "",
    customRegion: "",
    city,
    operationalLocation: state && city ? `${state} · ${city}` : state || city,
    location: city,
  };
}

export function isLocationDraftComplete(draft: LocationDraft): boolean {
  if (!isIndiaCountry(draft.country)) {
    return normalizeCountryCode(draft.country).length === 2;
  }
  if (!draft.stateCode || !draft.state.trim()) return false;
  return draft.city.trim().length > 0;
}

export function getLocationDraftError(draft: LocationDraft): string | null {
  if (!draft.country?.trim()) return "Select your country.";
  if (!isIndiaCountry(draft.country)) return null;
  if (!draft.stateCode) return "Select your state.";
  if (!draft.state.trim()) return "Select your state.";
  if (!draft.city.trim()) return "Select your city.";
  return null;
}

/** Parse legacy free-text operational location into draft when possible */
export function parseLegacyLocationDraft(
  operationalLocation: string,
  city: string,
): LocationDraft {
  const draft = emptyLocationDraft();
  const op = operationalLocation.trim();
  if (!op) {
    draft.city = city.trim();
    return draft;
  }

  const parts = op.split("·").map((p) => p.trim());
  if (parts.length >= 2) {
    const stateName = parts[0];
    const regionPart = parts.slice(1).join(" · ");
    const matched = INDIAN_LOCATIONS.find(
      (s) => s.name.toLowerCase() === stateName.toLowerCase(),
    );
    if (matched) {
      draft.stateCode = matched.code;
      draft.state = matched.name;
      const knownRegion = matched.regions.find(
        (r) => r.toLowerCase() === regionPart.toLowerCase(),
      );
      if (knownRegion) {
        draft.region = knownRegion;
      } else {
        draft.region = OTHER_REGION;
        draft.customRegion = regionPart;
      }
    }
  }

  draft.city = city.trim();
  return draft;
}
