import { create } from "zustand";

import type {
  MaterialRecommendationItem,
  ParticipantRecommendationItem,
  RecommendationSection,
} from "@/types/recommendation";

type RecommendationStore = {
  materialSections: RecommendationSection<MaterialRecommendationItem>[];
  participantSections: RecommendationSection<ParticipantRecommendationItem>[];
  setMaterialSections: (
    sections: RecommendationSection<MaterialRecommendationItem>[]
  ) => void;
  setParticipantSections: (
    sections: RecommendationSection<ParticipantRecommendationItem>[]
  ) => void;
  clear: () => void;
};

export const useRecommendationStore = create<RecommendationStore>((set) => ({
  materialSections: [],
  participantSections: [],
  setMaterialSections: (materialSections) => set({ materialSections }),
  setParticipantSections: (participantSections) => set({ participantSections }),
  clear: () => set({ materialSections: [], participantSections: [] }),
}));
