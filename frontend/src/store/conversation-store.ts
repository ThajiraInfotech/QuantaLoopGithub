import { create } from "zustand";

import type { Conversation } from "@/types/conversation";

type ConversationStore = {
  items: Conversation[];
  setItems: (items: Conversation[]) => void;
  clear: () => void;
};

export const useConversationStore = create<ConversationStore>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  clear: () => set({ items: [] }),
}));
