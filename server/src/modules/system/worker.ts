import si from 'systeminformation';
import type { DashboardState, SystemState } from '@shared/types.js';
import { WS_EVENTS } from '@shared/types.js';

type Deps = {
  updateState: (p: Partial<DashboardState>) => DashboardState;
  broadcast: (m: { event: string; data: unknown }) => void;
};

export function createWorker({ updateState, broadcast }: Deps) {
  return {
    intervalMs: 3_000,

    async fetch() {
      const [load, mem, fs, gpu] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.graphics(),
      ]);

      const gpuLoad = gpu.controllers[0]?.utilizationGpu;

      const system: SystemState = {
        cpu: Math.round(load.currentLoad),
        memory: Math.round((mem.used / mem.total) * 100),
        disk: Math.round(fs[0]?.use ?? 0),
        gpu: gpuLoad != null ? Math.round(gpuLoad) : undefined,
        uptime: Math.floor(process.uptime()),
        updatedAt: new Date().toISOString(),
      };

      updateState({ system });
      broadcast({ event: WS_EVENTS.SYSTEM_UPDATE, data: { system } });
    },
  };
}
