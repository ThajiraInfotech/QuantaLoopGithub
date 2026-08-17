import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { IndustryProfileInput } from "@/lib/industry-profile";
import {
  type LocationDraft,
  emptyLocationDraft,
  parseLegacyLocationDraft,
} from "@/lib/location-profile";
import type { SignupRole } from "@/types/user";

export type IndustryDraft = {
  primaryIndustry: string | null;
  secondaryIndustries: string[];
  customIndustry: string;
};

export const emptyIndustryDraft = (): IndustryDraft => ({
  primaryIndustry: null,
  secondaryIndustries: [],
  customIndustry: "",
});

export function normalizeIndustryDraft(value: unknown): IndustryDraft {
  if (value == null) {
    return emptyIndustryDraft();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return {
      primaryIndustry: trimmed || null,
      secondaryIndustries: [],
      customIndustry: "",
    };
  }
  if (typeof value === "object") {
    const v = value as Partial<IndustryDraft>;
    return {
      primaryIndustry:
        typeof v.primaryIndustry === "string" && v.primaryIndustry.trim()
          ? v.primaryIndustry.trim()
          : null,
      secondaryIndustries: Array.isArray(v.secondaryIndustries)
        ? v.secondaryIndustries.filter((s) => typeof s === "string" && s.trim())
        : [],
      customIndustry:
        typeof v.customIndustry === "string" ? v.customIndustry : "",
    };
  }
  return emptyIndustryDraft();
}

export function normalizeLocationDraft(value: unknown): LocationDraft {
  if (value == null || typeof value !== "object") {
    return emptyLocationDraft();
  }
  const v = value as Partial<LocationDraft>;
  return {
    stateCode: typeof v.stateCode === "string" ? v.stateCode : "",
    state: typeof v.state === "string" ? v.state : "",
    region: typeof v.region === "string" ? v.region : "",
    customRegion: typeof v.customRegion === "string" ? v.customRegion : "",
    city: typeof v.city === "string" ? v.city : "",
    country:
      typeof v.country === "string" && v.country.trim()
        ? v.country.trim().toUpperCase()
        : "IN",
  };
}

export type OnboardingDraftState = {
  pendingSignupRole: SignupRole | null;
  pendingSignupEmail: string;
  pendingSignupName: string;
  pendingGoogleCredential: string | null;
  draftIndustry: IndustryDraft;
  draftMaterials: string[];
  draftLocation: LocationDraft;
  setPendingSignupRole: (role: SignupRole | null) => void;
  setPendingSignupEmail: (email: string) => void;
  setPendingGoogleProfile: (profile: {
    email: string;
    name: string;
    credential: string;
  }) => void;
  clearPendingGoogleProfile: () => void;
  setDraftIndustry: (draft: IndustryDraft) => void;
  setDraftMaterials: (materials: string[]) => void;
  setDraftLocation: (draft: LocationDraft) => void;
  clearOnboardingDraft: () => void;
  hasOnboardingDraft: () => boolean;
};

const initialDraft = {
  pendingSignupRole: null as SignupRole | null,
  pendingSignupEmail: "",
  pendingSignupName: "",
  pendingGoogleCredential: null as string | null,
  draftIndustry: emptyIndustryDraft(),
  draftMaterials: [] as string[],
  draftLocation: emptyLocationDraft(),
};

function normalizePersistedState(
  persisted: unknown,
): Partial<OnboardingDraftState> {
  if (!persisted || typeof persisted !== "object") {
    return {};
  }
  const state = persisted as Record<string, unknown>;

  let draftLocation = emptyLocationDraft();
  if (state.draftLocation && typeof state.draftLocation === "object") {
    draftLocation = normalizeLocationDraft(state.draftLocation);
  }
  const legacyOp =
    typeof state.draftOperationalLocation === "string"
      ? state.draftOperationalLocation
      : "";
  const legacyCity =
    typeof state.draftLocationLegacy === "string"
      ? state.draftLocationLegacy
      : typeof state.draftLocation === "string"
        ? state.draftLocation
        : "";
  if (!draftLocation.stateCode && (legacyOp || legacyCity)) {
    draftLocation = parseLegacyLocationDraft(legacyOp, legacyCity);
  }

  return {
    pendingSignupRole:
      state.pendingSignupRole === "material_provider" ||
      state.pendingSignupRole === "verified_buyer"
        ? state.pendingSignupRole
        : null,
    pendingSignupEmail:
      typeof state.pendingSignupEmail === "string"
        ? state.pendingSignupEmail.trim()
        : "",
    pendingSignupName:
      typeof state.pendingSignupName === "string"
        ? state.pendingSignupName.trim()
        : "",
    pendingGoogleCredential:
      typeof state.pendingGoogleCredential === "string" &&
      state.pendingGoogleCredential.trim()
        ? state.pendingGoogleCredential
        : null,
    draftIndustry: normalizeIndustryDraft(state.draftIndustry),
    draftMaterials: Array.isArray(state.draftMaterials)
      ? state.draftMaterials.filter((m) => typeof m === "string")
      : [],
    draftLocation,
  };
}

export const useOnboardingStore = create<OnboardingDraftState>()(
  persist(
    (set, get) => ({
      ...initialDraft,
      setPendingSignupRole: (role) => set({ pendingSignupRole: role }),
      setPendingSignupEmail: (email) =>
        set({ pendingSignupEmail: email.trim() }),
      setPendingGoogleProfile: ({ email, name, credential }) =>
        set({
          pendingSignupEmail: email.trim(),
          pendingSignupName: name.trim(),
          pendingGoogleCredential: credential,
        }),
      clearPendingGoogleProfile: () =>
        set({
          pendingSignupEmail: "",
          pendingSignupName: "",
          pendingGoogleCredential: null,
        }),
      setDraftIndustry: (draft) =>
        set({ draftIndustry: normalizeIndustryDraft(draft) }),
      setDraftMaterials: (materials) => set({ draftMaterials: materials }),
      setDraftLocation: (draft) =>
        set({ draftLocation: normalizeLocationDraft(draft) }),
      clearOnboardingDraft: () => set({ ...initialDraft }),
      hasOnboardingDraft: () => {
        const s = get();
        const industry = normalizeIndustryDraft(s.draftIndustry);
        const loc = normalizeLocationDraft(s.draftLocation);
        return (
          industry.primaryIndustry !== null ||
          s.draftMaterials.length > 0 ||
          loc.stateCode !== "" ||
          loc.city.trim() !== ""
        );
      },
    }),
    {
      name: "quanta-onboarding-draft",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        pendingSignupRole: state.pendingSignupRole,
        pendingSignupEmail: state.pendingSignupEmail,
        pendingSignupName: state.pendingSignupName,
        pendingGoogleCredential: state.pendingGoogleCredential,
        draftIndustry: normalizeIndustryDraft(state.draftIndustry),
        draftMaterials: state.draftMaterials,
        draftLocation: normalizeLocationDraft(state.draftLocation),
      }),
      merge: (persisted, current) => ({
        ...current,
        ...normalizePersistedState(persisted),
      }),
      migrate: (persisted) => ({
        ...initialDraft,
        ...normalizePersistedState(persisted),
      }),
      version: 5,
    },
  ),
);

export function draftIndustryToProfile(
  draft: IndustryDraft | unknown,
): IndustryProfileInput | null {
  const normalized = normalizeIndustryDraft(draft);
  if (!normalized.primaryIndustry) return null;
  return {
    primaryIndustry: normalized.primaryIndustry,
    secondaryIndustries: normalized.secondaryIndustries,
    customIndustry: normalized.customIndustry,
  };
}
