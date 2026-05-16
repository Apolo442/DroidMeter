import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./auth.js', () => ({ getAccessToken: vi.fn().mockResolvedValue('mock-token') }));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { createWorker } from './worker.js';

const PLAYING = {
  is_playing: true,
  progress_ms: 102_000,
  item: {
    name: 'Numb',
    duration_ms: 187_000,
    artists: [{ name: 'Linkin Park' }],
    album: { name: 'Meteora', release_date: '2003-03-25', images: [{ url: 'https://i.scdn.co/cover.jpg' }] },
  },
};

describe('spotify worker', () => {
  const updateState = vi.fn();
  const broadcast = vi.fn();

  beforeEach(() => { vi.clearAllMocks(); });

  it('normaliza resposta de música tocando', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(PLAYING) });
    await createWorker({ updateState, broadcast }).fetch();
    expect(updateState).toHaveBeenCalledWith({
      spotify: expect.objectContaining({
        isPlaying: true, track: 'Numb', artist: 'Linkin Park',
        album: 'Meteora', albumYear: '2003', progressMs: 102_000,
        durationMs: 187_000, coverUrl: 'https://i.scdn.co/cover.jpg',
      }),
    });
  });

  it('retorna isPlaying false quando 204 (nada tocando)', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204 });
    await createWorker({ updateState, broadcast }).fetch();
    expect(updateState).toHaveBeenCalledWith({ spotify: expect.objectContaining({ isPlaying: false }) });
  });

  it('faz broadcast do evento spotify:update', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(PLAYING) });
    await createWorker({ updateState, broadcast }).fetch();
    expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ event: 'spotify:update' }));
  });
});
