import { isLocationDraftComplete, type LocationDraft } from "@/lib/location-profile";
import { normalizeLocationDraft, useOnboardingStore } from "@/store/onboarding-store";

export function isMaterialsDraftComplete(materials: string[]): boolean {
  return materials.length > 0;
}

export function buildLocationSummary(draft: LocationDraft): string {
  if (draft.country && draft.country.toUpperCase() !== "IN") {
    return draft.country.toUpperCase();
  }
  const state = draft.state.trim();
  const city = draft.city.trim();
  if (state && city) return `${state} · ${city}`;
  if (state) return state;
  return city;
}

export function isRecommendationOnboardingComplete(state?: {
  draftMaterials: string[];
  draftLocation: unknown;
}): boolean {
  const snapshot = state ?? useOnboardingStore.getState();
  const location = normalizeLocationDraft(snapshot.draftLocation);
  return (
    isMaterialsDraftComplete(snapshot.draftMaterials) &&
    isLocationDraftComplete(location)
  );
}
