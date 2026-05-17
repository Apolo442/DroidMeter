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
      const [load, mem, fs, gpu, cpuTemp] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.graphics(),
        si.cpuTemperature(),
      ]);

      const gpuLoad = gpu.controllers[0]?.utilizationGpu;
      const gpuTemp = gpu.controllers[0]?.temperatureGpu;

      // RAM: usa total - available para excluir buff/cache (igual ao "used" do free -h)
      const usedMemory = mem.available != null ? mem.total - mem.available : mem.used;
      const memPct = Math.round((usedMemory / mem.total) * 100);
      const memoryUsedGb = Math.round((usedMemory / 1024 ** 3) * 10) / 10;
      // Disco: pega o mount "/" para evitar pegar EFI ou outros volumes primeiro
      const rootFs = fs.find((f) => f.mount === '/') ?? fs[0];

      const system: SystemState = {
        cpu: Math.round(load.currentLoad),
        memory: memPct,
        memoryUsedGb,
        disk: Math.round(rootFs?.use ?? 0),
        gpu: gpuLoad != null ? Math.round(gpuLoad) : undefined,
        cpuTemp: cpuTemp.main != null ? Math.round(cpuTemp.main) : undefined,
        gpuTemp: gpuTemp != null ? Math.round(gpuTemp) : undefined,
        uptime: Math.floor(process.uptime()),
        updatedAt: new Date().toISOString(),
      };

      updateState({ system });
      broadcast({ event: WS_EVENTS.SYSTEM_UPDATE, data: { system } });
    },
  };
}
