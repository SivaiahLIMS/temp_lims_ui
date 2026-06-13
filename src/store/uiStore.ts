import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  currentBranchId: number;
  notifications: number;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentBranchId: (id: number) => void;
  setNotifications: (count: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      currentBranchId: 1,
      notifications: 0,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCurrentBranchId: (id) => set({ currentBranchId: id }),
      setNotifications: (count) => set({ notifications: count }),
    }),
    { name: 'lims-ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, currentBranchId: s.currentBranchId }) }
  )
);
