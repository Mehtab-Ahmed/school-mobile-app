import { create } from 'zustand';

/** Which child a parent is looking at. Every parent screen follows the same choice. */
interface ChildState {
  selectedChildId: number | null;
  setSelectedChildId: (id: number | null) => void;
}

export const useChildStore = create<ChildState>((set) => ({
  selectedChildId: null,
  setSelectedChildId: (id) => set({ selectedChildId: id }),
}));
