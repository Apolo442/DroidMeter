import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPoller } from './poller.js';

describe('createPoller', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('chama fn imediatamente ao iniciar', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    createPoller(fn, 5000).start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('chama fn novamente após o intervalo', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    createPoller(fn, 5000).start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5000);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('para de chamar fn após stop()', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const p = createPoller(fn, 5000);
    p.start();
    await vi.advanceTimersByTimeAsync(0);
    p.stop();
    await vi.advanceTimersByTimeAsync(10000);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
