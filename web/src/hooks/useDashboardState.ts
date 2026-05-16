import { useDashboardStore } from '@/lib/store';
import type { DashboardState } from '@shared/types';

export function useDashboardState<T>(selector: (s: DashboardState) => T): T {
  return useDashboardStore((store) => selector(store.state));
}
