import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('systeminformation', () => ({
  default: {
    currentLoad: vi.fn(),
    mem: vi.fn(),
    fsSize: vi.fn(),
    graphics: vi.fn(),
    cpuTemperature: vi.fn(),
  },
}));

import si from 'systeminformation';
import { createWorker } from './worker.js';

describe('system worker', () => {
  const updateState = vi.fn();
  const broadcast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(si.currentLoad).mockResolvedValue({ currentLoad: 22.4 } as any);
    vi.mocked(si.mem).mockResolvedValue({ available: 6_000_000_000, total: 16_000_000_000 } as any);
    vi.mocked(si.fsSize).mockResolvedValue([{ mount: '/', use: 48.2 }] as any);
    vi.mocked(si.graphics).mockResolvedValue({ controllers: [{ utilizationGpu: 38, temperatureGpu: 57.6 }] } as any);
    vi.mocked(si.cpuTemperature).mockResolvedValue({ main: 64.4 } as any);
  });

  it('normaliza métricas e chama updateState', async () => {
    await createWorker({ updateState, broadcast }).fetch();
    expect(updateState).toHaveBeenCalledWith({
      system: expect.objectContaining({ cpu: 22, memory: 63, disk: 48, gpu: 38, cpuTemp: 64, gpuTemp: 58 }),
    });
  });

  it('faz broadcast do evento system:update', async () => {
    await createWorker({ updateState, broadcast }).fetch();
    expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ event: 'system:update' }));
  });

  it('omite gpu se nenhum controller encontrado', async () => {
    vi.mocked(si.graphics).mockResolvedValue({ controllers: [] } as any);
    await createWorker({ updateState, broadcast }).fetch();
    expect(updateState.mock.calls[0][0].system?.gpu).toBeUndefined();
    expect(updateState.mock.calls[0][0].system?.gpuTemp).toBeUndefined();
  });
});
