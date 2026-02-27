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

  // Scanner & Search (shared between Header and FAB)
  showScanner: boolean;
  setShowScanner: (show: boolean) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;

  // Celebration overlay
  showCelebration: boolean;
  triggerCelebration: () => void;
  clearCelebration: () => void;

  // Sprint 3 — Social
  notificationCount: number;
  setNotificationCount: (count: number) => void;

  showFriendSearch: boolean;
  setShowFriendSearch: (show: boolean) => void;

  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;

  selectedTrophyId: string | null;
  openTrophyModal: (trophyId: string) => void;
  closeTrophyModal: () => void;

  selectedUserId: string | null;
  openUserProfileModal: (userId: string) => void;
  closeUserProfileModal: () => void;
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

  showScanner: false,
  setShowScanner: (show) => set({ showScanner: show }),
  showSearch: false,
  setShowSearch: (show) => set({ showSearch: show }),

  showCelebration: false,
  triggerCelebration: () => set({ showCelebration: true }),
  clearCelebration: () => set({ showCelebration: false }),

  // Sprint 3 — Social
  notificationCount: 0,
  setNotificationCount: (count) => set({ notificationCount: count }),

  showFriendSearch: false,
  setShowFriendSearch: (show) => set({ showFriendSearch: show }),

  showNotifications: false,
  setShowNotifications: (show) => set({ showNotifications: show }),

  selectedTrophyId: null,
  openTrophyModal: (trophyId) => set({ selectedTrophyId: trophyId }),
  closeTrophyModal: () => set({ selectedTrophyId: null }),

  selectedUserId: null,
  openUserProfileModal: (userId) => set({ selectedUserId: userId }),
  closeUserProfileModal: () => set({ selectedUserId: null }),
}));
