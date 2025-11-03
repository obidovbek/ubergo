/**
 * Store Configuration
 * Global state management setup (example with Zustand)
 * Install: npm install zustand
 */

import { create } from 'zustand';
import type { Ride } from '../api/rides';

interface RideState {
  currentRide: Ride | null;
  rideHistory: Ride[];
  setCurrentRide: (ride: Ride | null) => void;
  addToHistory: (ride: Ride) => void;
  clearHistory: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  currentRide: null,
  rideHistory: [],
  
  setCurrentRide: (ride) => set({ currentRide: ride }),
  
  addToHistory: (ride) =>
    set((state) => ({
      rideHistory: [ride, ...state.rideHistory],
    })),
  
  clearHistory: () => set({ rideHistory: [] }),
}));

// Example of a UI state store
interface UIState {
  theme: 'light' | 'dark';
  isMapExpanded: boolean;
  toggleTheme: () => void;
  setMapExpanded: (expanded: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  isMapExpanded: false,
  
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
  
  setMapExpanded: (expanded) => set({ isMapExpanded: expanded }),
}));

