import { create } from "zustand";

interface XPToast {
  amount: number;
  label: string;
}

interface AppState {
  // Beer detail modal
  selectedBeerId: string | null;
  openBeerModal: (beerId: string) => void;
  closeBeerModal: () => void;

  // XP Toast
  xpToast: XPToast | null;
  showXPToast: (amount: number, label: string) => void;
  clearXPToast: () => void;

  // Glupp modal (add beer to collection)
  gluppModalBeerId: string | null;
  openGluppModal: (beerId: string) => void;
  closeGluppModal: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedBeerId: null,
  openBeerModal: (beerId) => set({ selectedBeerId: beerId }),
  closeBeerModal: () => set({ selectedBeerId: null }),

  xpToast: null,
  showXPToast: (amount, label) => set({ xpToast: { amount, label } }),
  clearXPToast: () => set({ xpToast: null }),

  gluppModalBeerId: null,
  openGluppModal: (beerId) => set({ gluppModalBeerId: beerId }),
  closeGluppModal: () => set({ gluppModalBeerId: null }),
}));
