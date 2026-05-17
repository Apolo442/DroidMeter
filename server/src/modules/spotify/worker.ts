import { getAccessToken } from './auth.js';
import type { DashboardState, SpotifyState, SpotifyQueueItem } from '@shared/types.js';
import { WS_EVENTS } from '@shared/types.js';

type Deps = {
  updateState: (p: Partial<DashboardState>) => DashboardState;
  broadcast: (m: { event: string; data: unknown }) => void;
};

export function createWorker({ updateState, broadcast }: Deps) {
  let lastTrackId: string | null = null;
  let lastQueue: SpotifyQueueItem[] = [];

  return {
    intervalMs: 3_000,

    async fetch() {
      const token = await getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };

      const res = await globalThis.fetch(
        'https://api.spotify.com/v1/me/player/currently-playing',
        { headers },
      );

      let spotify: SpotifyState;

      if (res.status === 204 || !res.ok) {
        lastTrackId = null;
        lastQueue = [];
        spotify = { isPlaying: false, queue: [], updatedAt: new Date().toISOString() };
      } else {
        const j = await res.json() as any;
        const trackId: string | null = j.item?.id ?? null;

        if (trackId !== lastTrackId) {
          lastTrackId = trackId;
          if (trackId) {
            try {
              const qRes = await globalThis.fetch(
                'https://api.spotify.com/v1/me/player/queue',
                { headers },
              );
              if (qRes.ok) {
                const qj = await qRes.json() as any;
                lastQueue = ((qj.queue ?? []) as any[]).slice(0, 5).map(
                  (item): SpotifyQueueItem => ({
                    track: item.name,
                    artist: item.artists?.[0]?.name ?? '',
                    album: item.album?.name,
                    coverUrl: item.album?.images?.[0]?.url,
                  }),
                );
              }
            } catch {
              lastTrackId = null;
              lastQueue = [];
            }
          } else {
            lastQueue = [];
          }
        }

        spotify = {
          isPlaying: j.is_playing,
          track: j.item?.name,
          artist: j.item?.artists?.[0]?.name,
          album: j.item?.album?.name,
          albumYear: j.item?.album?.release_date?.slice(0, 4),
          coverUrl: j.item?.album?.images?.[0]?.url,
          progressMs: j.progress_ms,
          durationMs: j.item?.duration_ms,
          queue: lastQueue,
          updatedAt: new Date().toISOString(),
        };
      }

      updateState({ spotify });
      broadcast({ event: WS_EVENTS.SPOTIFY_UPDATE, data: { spotify } });
    },
  };
}
