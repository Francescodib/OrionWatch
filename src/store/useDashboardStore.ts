import { create } from "zustand";
import type { CorsStrategy } from "@/data/utils/cors";

interface DashboardStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  corsStrategy: CorsStrategy | null;
  setCorsStrategy: (s: CorsStrategy) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
  activeMainTab: string;
  setActiveMainTab: (tab: string) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  corsStrategy: null,
  setCorsStrategy: (corsStrategy) => set({ corsStrategy }),
  toastMessage: null,
  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => set({ toastMessage: null }), 5000);
  },
  clearToast: () => set({ toastMessage: null }),
  activeMainTab: "profile",
  setActiveMainTab: (activeMainTab) => set({ activeMainTab }),
}));
