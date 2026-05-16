import type { DashboardState } from '@shared/types.js';

let state: DashboardState = {};

export function getState(): DashboardState {
  return state;
}

export function updateState(patch: Partial<DashboardState>): DashboardState {
  state = { ...state, ...patch };
  return state;
}
