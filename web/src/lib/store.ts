import { create } from 'zustand';
import type { DashboardState } from '@shared/types';

type Store = {
  state: DashboardState;
  setPartial: (patch: Partial<DashboardState>) => void;
  setAll: (full: DashboardState) => void;
};

export const useDashboardStore = create<Store>((set) => ({
  state: {},
  setPartial: (patch) => set((s) => ({ state: { ...s.state, ...patch } })),
  setAll: (full) => set({ state: full }),
}));
