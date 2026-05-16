import { ACTIVE_MODULES } from '@shared/modules.config.js';
import { createPoller } from './utils/poller.js';
import { broadcast } from './server.js';
import { updateState } from './state.js';

const WORKERS: Record<string, () => Promise<{ createWorker: Function }>> = {
  weather: () => import('./modules/weather/worker.js'),
  spotify: () => import('./modules/spotify/worker.js'),
  system:  () => import('./modules/system/worker.js'),
  github:  () => import('./modules/github/worker.js'),
};

export async function startRegistry() {
  const deps = { updateState, broadcast };

  for (const id of ACTIVE_MODULES) {
    if (id === 'clock') continue;
    const loader = WORKERS[id];
    if (!loader) continue;

    const { createWorker } = await loader();
    const worker = createWorker(deps);
    createPoller(worker.fetch, worker.intervalMs).start();
    console.log(`[registry] ${id} iniciado (a cada ${worker.intervalMs}ms)`);
  }
}
