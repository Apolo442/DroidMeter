import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import type { WebSocket } from '@fastify/websocket';
import { getState, updateState } from './state.js';
import { registerHubRoute } from './modules/hub/route.js';
import { WS_EVENTS } from '@shared/types.js';
import type { WsMessage } from '@shared/types.js';

const clients = new Set<WebSocket>();

export function broadcast(message: WsMessage): void {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1) client.send(payload);
  }
}

export async function buildServer() {
  const app = Fastify({ logger: false });
  await app.register(fastifyWebsocket);

  app.get('/ws', { websocket: true }, (socket) => {
    clients.add(socket);
    socket.send(JSON.stringify({ event: WS_EVENTS.INIT, data: getState() }));
    socket.on('close', () => clients.delete(socket));
  });

  app.get('/health', async () => ({ ok: true, clients: clients.size }));

  await registerHubRoute(app, { updateState, broadcast });

  return app;
}
