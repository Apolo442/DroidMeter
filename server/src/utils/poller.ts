export function createPoller(fn: () => Promise<void>, intervalMs: number) {
  let timer: ReturnType<typeof setInterval> | null = null;

  async function tick() {
    try { await fn(); } catch (err) { console.error('[poller]', err); }
  }

  return {
    start() { void tick(); timer = setInterval(tick, intervalMs); },
    stop() { if (timer) clearInterval(timer); },
  };
}
