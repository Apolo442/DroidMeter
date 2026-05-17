import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./auth.js', () => ({ getAccessToken: vi.fn().mockResolvedValue('mock-token') }));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { createWorker } from './worker.js';

const PLAYING = {
  is_playing: true,
  progress_ms: 102_000,
  item: {
    id: 'track-abc',
    name: 'Numb',
    duration_ms: 187_000,
    artists: [{ name: 'Linkin Park' }],
    album: { name: 'Meteora', release_date: '2003-03-25', images: [{ url: 'https://i.scdn.co/cover.jpg' }] },
  },
};

const QUEUE_RESPONSE = {
  queue: [
    { name: 'In the End', artists: [{ name: 'Linkin Park' }], album: { name: 'Hybrid Theory', images: [{ url: 'https://i.scdn.co/cover2.jpg' }] } },
    { name: 'Crawling',   artists: [{ name: 'Linkin Park' }], album: { name: 'Hybrid Theory', images: [{ url: 'https://i.scdn.co/cover3.jpg' }] } },
    { name: 'Faint',      artists: [{ name: 'Linkin Park' }], album: { name: 'Meteora',        images: [{ url: 'https://i.scdn.co/cover4.jpg' }] } },
  ],
};

describe('spotify worker', () => {
  const updateState = vi.fn();
  const broadcast = vi.fn();

  beforeEach(() => { vi.clearAllMocks(); });

  it('normaliza resposta de música tocando', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(PLAYING) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(QUEUE_RESPONSE) });

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
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

    await createWorker({ updateState, broadcast }).fetch();

    expect(updateState).toHaveBeenCalledWith({ spotify: expect.objectContaining({ isPlaying: false }) });
  });

  it('faz broadcast do evento spotify:update', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(PLAYING) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(QUEUE_RESPONSE) });

    await createWorker({ updateState, broadcast }).fetch();

    expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ event: 'spotify:update' }));
  });

  it('busca fila na primeira vez que detecta uma faixa', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(PLAYING) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(QUEUE_RESPONSE) });

    await createWorker({ updateState, broadcast }).fetch();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(2,
      'https://api.spotify.com/v1/me/player/queue',
      expect.objectContaining({ headers: { Authorization: 'Bearer mock-token' } }),
    );
    expect(updateState).toHaveBeenCalledWith({
      spotify: expect.objectContaining({
        queue: expect.arrayContaining([
          expect.objectContaining({ track: 'In the End', artist: 'Linkin Park', coverUrl: 'https://i.scdn.co/cover2.jpg' }),
        ]),
      }),
    });
  });

  it('reutiliza fila em cache quando a faixa não muda (não faz 2º fetch de queue)', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(PLAYING) })        // ciclo 1: currently-playing
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(QUEUE_RESPONSE) }) // ciclo 1: queue
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(PLAYING) });       // ciclo 2: currently-playing

    const worker = createWorker({ updateState, broadcast });
    await worker.fetch(); // ciclo 1 → faixa nova → busca queue (2 fetches)
    await worker.fetch(); // ciclo 2 → mesma faixa → só currently-playing (1 fetch)

    expect(mockFetch).toHaveBeenCalledTimes(3);

    const secondCallState = updateState.mock.calls[1][0];
    expect(secondCallState.spotify.queue).toEqual(
      expect.arrayContaining([expect.objectContaining({ track: 'In the End' })]),
    );
  });

  it('busca nova fila quando a faixa muda', async () => {
    const PLAYING_2 = {
      ...PLAYING,
      item: { ...PLAYING.item, id: 'track-xyz', name: 'Faint' },
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(PLAYING) })        // ciclo 1: currently-playing
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(QUEUE_RESPONSE) }) // ciclo 1: queue
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(PLAYING_2) })      // ciclo 2: currently-playing
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ queue: [] }) }); // ciclo 2: queue nova

    const worker = createWorker({ updateState, broadcast });
    await worker.fetch();
    await worker.fetch();

    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('limpa fila e lastTrackId quando Spotify fecha (204)', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(PLAYING) })        // ciclo 1: tocando
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(QUEUE_RESPONSE) }) // ciclo 1: queue
      .mockResolvedValueOnce({ ok: true, status: 204 });                                              // ciclo 2: fechou

    const worker = createWorker({ updateState, broadcast });
    await worker.fetch();
    await worker.fetch();

    const lastState = updateState.mock.calls[updateState.mock.calls.length - 1][0];
    expect(lastState.spotify.queue).toEqual([]);
    expect(lastState.spotify.isPlaying).toBe(false);
  });

  it('ao reabrir Spotify após fechar, busca fila novamente', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 204 })                                               // ciclo 1: fechado
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(PLAYING) })        // ciclo 2: reabriu
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(QUEUE_RESPONSE) });// ciclo 2: queue

    const worker = createWorker({ updateState, broadcast });
    await worker.fetch();
    await worker.fetch();

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('degrada silenciosamente se o fetch da fila falhar', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(PLAYING) })        // currently-playing ok
      .mockRejectedValueOnce(new Error('network error'));                                              // queue falha

    const worker = createWorker({ updateState, broadcast });
    await expect(worker.fetch()).resolves.not.toThrow();
    expect(updateState).toHaveBeenCalledWith({
      spotify: expect.objectContaining({ track: 'Numb', queue: [] }),
    });
  });

  it('recupera fila no ciclo seguinte após falha transiente', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(PLAYING) })        // ciclo 1: currently-playing
      .mockRejectedValueOnce(new Error('network error'))                                              // ciclo 1: queue falha
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(PLAYING) })        // ciclo 2: currently-playing (mesma faixa)
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(QUEUE_RESPONSE) });// ciclo 2: queue ok desta vez

    const worker = createWorker({ updateState, broadcast });
    await worker.fetch(); // ciclo 1: queue falha, emite queue: []
    await worker.fetch(); // ciclo 2: retry funciona, emite queue populada

    expect(mockFetch).toHaveBeenCalledTimes(4); // 2 fetches por ciclo
    const secondCallState = updateState.mock.calls[1][0];
    expect(secondCallState.spotify.queue).toEqual(
      expect.arrayContaining([expect.objectContaining({ track: 'In the End' })]),
    );
  });
});
