import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { registerHubRoute } from './route.js';

describe('POST /hub-health', () => {
  const updateState = vi.fn();
  const broadcast = vi.fn();
  const chargeControl = { handle: vi.fn() };

  async function buildApp() {
    const app = Fastify();
    await registerHubRoute(app, { updateState, broadcast, chargeControl });
    return app;
  }

  const validPayload = {
    battery: { level: 80, status: 'charging', plugged: 'usb', temperature: 32, inputSuspended: false },
    wifi: { rssi: -55, signalLabel: 'Forte', latencyMs: 5, linkSpeedMbps: 72 },
    screen: { brightnessPercent: 50, onTimeSec: 3600 },
    cpuTemp: 38,
    cpuUsage: 18,
    memory: 48,
    memoryUsedGb: 1.9,
    updatedAt: '2026-05-17T12:00:00Z',
  };

  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 se battery ausente', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST', url: '/hub-health',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ wifi: validPayload.wifi }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 400 se wifi ausente', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST', url: '/hub-health',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ battery: validPayload.battery }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 400 se screen ausente', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST', url: '/hub-health',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ battery: validPayload.battery, wifi: validPayload.wifi }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 200 com payload valido', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST', url: '/hub-health',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPayload),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('chama updateState com hub quando payload valido', async () => {
    const app = await buildApp();
    await app.inject({
      method: 'POST', url: '/hub-health',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPayload),
    });
    expect(updateState).toHaveBeenCalledWith({ hub: validPayload });
  });

  it('faz broadcast hub:update com payload valido', async () => {
    const app = await buildApp();
    await app.inject({
      method: 'POST', url: '/hub-health',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPayload),
    });
    expect(broadcast).toHaveBeenCalledWith({
      event: 'hub:update',
      data: { hub: validPayload },
    });
  });

  it('aciona controle de carga com payload valido', async () => {
    const app = await buildApp();
    await app.inject({
      method: 'POST', url: '/hub-health',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPayload),
    });
    expect(chargeControl.handle).toHaveBeenCalledWith(validPayload);
  });
});
