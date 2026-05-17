import type { FastifyInstance } from 'fastify';
import type { DashboardState, HubState } from '@shared/types.js';
import { WS_EVENTS } from '@shared/types.js';

type Deps = {
  updateState: (p: Partial<DashboardState>) => DashboardState;
  broadcast: (m: { event: string; data: unknown }) => void;
};

export async function registerHubRoute(app: FastifyInstance, deps: Deps) {
  app.post('/hub-health', async (request, reply) => {
    const body = request.body as Record<string, unknown> | null;

    if (!body?.battery || !body?.wifi || !body?.screen || body?.cpuTemp == null) {
      return reply.status(400).send({ error: 'payload invalido' });
    }

    const hub = body as unknown as HubState;
    deps.updateState({ hub });
    deps.broadcast({ event: WS_EVENTS.HUB_UPDATE, data: { hub } });
    return { ok: true };
  });
}
