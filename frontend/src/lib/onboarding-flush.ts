import {
  draftIndustryToProfile,
  normalizeIndustryDraft,
  normalizeLocationDraft,
} from "@/store/onboarding-store";
import { industryProfileToPatch } from "@/lib/industry-profile";
import { isLocationDraftComplete, locationDraftToPatch } from "@/lib/location-profile";
import { isMaterialsDraftComplete } from "@/lib/onboarding-readiness";
import { patchMyProfile } from "@/services/profile/profile.service";
import { useOnboardingStore } from "@/store/onboarding-store";
import type { ProfilePatchInput } from "@/validations/profile";
import type { ProfileWithTrust } from "@/types/profile";
import type { User } from "@/types/user";

export function buildOnboardingProfilePatch(): ProfilePatchInput | null {
  const { draftIndustry, draftMaterials, draftLocation, pendingSignupRole } =
    useOnboardingStore.getState();

  const location = normalizeLocationDraft(draftLocation);
  if (!isMaterialsDraftComplete(draftMaterials)) return null;
  if (!isLocationDraftComplete(location)) return null;

  const patch: ProfilePatchInput = {};
  const industryPatch = draftIndustryToProfile(
    normalizeIndustryDraft(draftIndustry),
  );

  if (industryPatch) {
    Object.assign(patch, industryProfileToPatch(industryPatch));
  }
  if (draftMaterials.length > 0) {
    patch.materialsHandled = draftMaterials;
    if (pendingSignupRole === "verified_buyer") {
      patch.requiredMaterialCategories = draftMaterials;
    } else if (pendingSignupRole === "material_provider") {
      patch.preferredMaterialCategories = draftMaterials;
    }
  }

  Object.assign(patch, locationDraftToPatch(location));

  return Object.keys(patch).length > 0 ? patch : null;
}

export async function flushOnboardingDraftToProfile(): Promise<{
  profile: User;
  trustSignals: ProfileWithTrust["trustSignals"];
} | null> {
  const patch = buildOnboardingProfilePatch();
  if (!patch) return null;

  const { profile, trustSignals } = await patchMyProfile(patch);
  return { profile, trustSignals };
}
