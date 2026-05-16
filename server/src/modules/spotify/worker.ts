import { getAccessToken } from './auth.js';
import type { DashboardState, SpotifyState } from '@shared/types.js';
import { WS_EVENTS } from '@shared/types.js';

type Deps = {
  updateState: (p: Partial<DashboardState>) => DashboardState;
  broadcast: (m: { event: string; data: unknown }) => void;
};

export function createWorker({ updateState, broadcast }: Deps) {
  return {
    intervalMs: 3_000,

    async fetch() {
      const token = await getAccessToken();
      const res = await globalThis.fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${token}` },
      });

      let spotify: SpotifyState;

      if (res.status === 204 || !res.ok) {
        spotify = { isPlaying: false, updatedAt: new Date().toISOString() };
      } else {
        const j = await res.json() as any;
        spotify = {
          isPlaying: j.is_playing,
          track: j.item?.name,
          artist: j.item?.artists?.[0]?.name,
          album: j.item?.album?.name,
          albumYear: j.item?.album?.release_date?.slice(0, 4),
          coverUrl: j.item?.album?.images?.[0]?.url,
          progressMs: j.progress_ms,
          durationMs: j.item?.duration_ms,
          updatedAt: new Date().toISOString(),
        };
      }

      updateState({ spotify });
      broadcast({ event: WS_EVENTS.SPOTIFY_UPDATE, data: { spotify } });
    },
  };
}
