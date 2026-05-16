import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { createWorker } from './worker.js';

const TODAY = new Date().toISOString().slice(0, 10);

const EVENTS = [
  { type: 'PushEvent', created_at: `${TODAY}T10:00:00Z`, payload: { commits: [{}] }, repo: { name: 'user/finswarm' } },
  { type: 'PushEvent', created_at: `${TODAY}T11:00:00Z`, payload: { commits: [{}, {}] }, repo: { name: 'user/finswarm' } },
  { type: 'WatchEvent', created_at: `${TODAY}T12:00:00Z`, payload: {}, repo: { name: 'user/other' } },
];

describe('github worker', () => {
  const updateState = vi.fn();
  const broadcast = vi.fn();

  beforeEach(() => {
    process.env.GITHUB_USERNAME = 'testuser';
    process.env.GITHUB_TOKEN = 'test-token';
    vi.clearAllMocks();
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(EVENTS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ total_count: 2 }) });
  });

  it('conta commits de push hoje', async () => {
    await createWorker({ updateState, broadcast }).fetch();
    expect(updateState).toHaveBeenCalledWith({ github: expect.objectContaining({ commitsToday: 3 }) });
  });

  it('reporta quantidade de PRs abertos', async () => {
    await createWorker({ updateState, broadcast }).fetch();
    expect(updateState).toHaveBeenCalledWith({ github: expect.objectContaining({ openPRs: 2 }) });
  });

  it('deriva repo atual do push mais recente', async () => {
    await createWorker({ updateState, broadcast }).fetch();
    expect(updateState).toHaveBeenCalledWith({ github: expect.objectContaining({ currentRepo: 'finswarm' }) });
  });

  it('faz broadcast do evento github:update', async () => {
    await createWorker({ updateState, broadcast }).fetch();
    expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ event: 'github:update' }));
  });
});
