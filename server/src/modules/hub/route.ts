import type { FastifyInstance } from 'fastify';
import type { DashboardState, HubState, WsMessage } from '@shared/types.js';
import { WS_EVENTS } from '@shared/types.js';
import { createChargeController } from './charge-control.js';

type Deps = {
  updateState: (p: Partial<DashboardState>) => DashboardState;
  broadcast: (m: WsMessage) => void;
  chargeControl?: { handle: (hub: HubState) => void | Promise<unknown> };
};

const chargeController = createChargeController();

export async function registerHubRoute(app: FastifyInstance, deps: Deps) {
  app.post('/hub-health', async (request, reply) => {
    const body = request.body as Record<string, unknown> | null;

    if (!body?.battery || !body?.wifi || !body?.screen || body?.cpuTemp == null) {
      return reply.status(400).send({ error: 'payload invalido' });
    }

    const hub = body as unknown as HubState;
    deps.updateState({ hub });
    deps.broadcast({ event: WS_EVENTS.HUB_UPDATE, data: { hub } });
    void (deps.chargeControl ?? chargeController).handle(hub);
    return { ok: true };
  });
}
