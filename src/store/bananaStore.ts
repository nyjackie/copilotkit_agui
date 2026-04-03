import { create } from "zustand";

interface BananaState {
  visible: boolean;
  show: () => void;
  hide: () => void;
}

export const useBananaStore = create<BananaState>((set) => ({
  visible: false,
  show: () => {
    set({ visible: true });
    setTimeout(() => set({ visible: false }), 3000);
  },
  hide: () => set({ visible: false }),
}));
