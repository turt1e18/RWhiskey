import { create } from "zustand";

interface RecommendationState {
  selectedMainTag: string | null;
  setSelectedMainTag: (tag: string | null) => void;
  resetMainTag: () => void;
}

export const useRecommendationStore = create<RecommendationState>((set) => ({
  selectedMainTag: null,
  
  setSelectedMainTag: (tag) => set({ selectedMainTag: tag }),
  
  resetMainTag: () => set({ selectedMainTag: null }),
}));
