'use client';

import { useDashboardStore } from '@/lib/store';

function fmt(ms: number) {
  const s = Math.floor(ms / 1_000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function SpotifyWidget() {
  const spotify = useDashboardStore((s) => s.state.spotify);

  if (!spotify?.isPlaying) {
    return (
      <div className="rounded-[10px] h-full flex items-center p-[9px_11px] gap-[11px]"
        style={{ background: 'linear-gradient(145deg, #0d1f14 0%, #141814 100%)' }}>
        <div className="w-14 h-14 rounded-[7px] flex items-center justify-center text-[20px] shrink-0"
          style={{ background: 'linear-gradient(135deg, #1db95420, #0a4d2220)' }}>
          🎵
        </div>
        <span className="text-[9px] text-cool-gray">Nada tocando</span>
      </div>
    );
  }

  const pct = spotify.progressMs && spotify.durationMs
    ? (spotify.progressMs / spotify.durationMs) * 100 : 0;

  return (
    <div className="rounded-[10px] h-full flex items-center p-[9px_11px] gap-[11px]"
      style={{ background: 'linear-gradient(145deg, #0d1f14 0%, #141814 100%)' }}>

      {spotify.coverUrl ? (
        <img src={spotify.coverUrl} alt="Capa"
          className="w-14 h-14 rounded-[7px] shrink-0 object-cover"
          style={{ boxShadow: '0 6px 20px rgba(29,185,84,0.35)' }} />
      ) : (
        <div className="w-14 h-14 rounded-[7px] flex items-center justify-center text-[20px] shrink-0"
          style={{ background: 'linear-gradient(135deg,#1db954,#0a4d22)', boxShadow: '0 6px 20px rgba(29,185,84,0.35)' }}>
          🎵
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <div className="w-[5px] h-[5px] rounded-full bg-spotify-green" />
          <span className="text-[7px] font-semibold text-spotify-green uppercase tracking-[0.08em]">
            Tocando agora
          </span>
        </div>
        <div data-testid="spotify-track"
          className="text-[13px] font-semibold text-cloud-white tracking-[-0.25px] truncate">
          {spotify.track}
        </div>
        <div data-testid="spotify-artist" className="text-[9px] text-cool-gray mt-[2px] truncate">
          {spotify.artist}
        </div>
        <div className="text-[7.5px] text-dark-charcoal italic mt-[1px]">
          {spotify.album}{spotify.albumYear ? ` · ${spotify.albumYear}` : ''}
        </div>
        <div className="mt-2">
          <div className="h-[2.5px] rounded-full" style={{ background: '#1a2e1e' }}>
            <div className="h-[2.5px] rounded-full bg-spotify-green transition-all duration-1000"
              style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-[3px]">
            <span data-testid="spotify-current" className="text-[7px] text-dark-charcoal tabular-nums">
              {spotify.progressMs ? fmt(spotify.progressMs) : '0:00'}
            </span>
            <span data-testid="spotify-total" className="text-[7px] text-dark-charcoal tabular-nums">
              {spotify.durationMs ? fmt(spotify.durationMs) : '0:00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
