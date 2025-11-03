/**
 * Store Configuration
 * Global state management (example with simple store pattern)
 * You can replace this with Redux, Zustand, or any state management library
 */

import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

// Note: Install zustand if you want to use this
// npm install zustand

