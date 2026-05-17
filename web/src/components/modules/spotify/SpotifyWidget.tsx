'use client';

import { useState, useCallback } from 'react';
import { useDashboardStore } from '@/lib/store';
import { Music2, SkipBack, SkipForward, Play, Pause } from 'lucide-react';

function fmt(ms: number) {
  const s = Math.floor(ms / 1_000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

async function spotifyControl(action: 'play' | 'pause' | 'next' | 'prev') {
  const res = await fetch('/api/spotify/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error('Spotify control falhou:', data);
  }
}

export function SpotifyWidget() {
  const spotify = useDashboardStore((s) => s.state.spotify);
  // Estado otimista: muda imediatamente ao clicar, reseta em 3s para o WebSocket tomar conta
  const [optimisticPlaying, setOptimisticPlaying] = useState<boolean | null>(null);
  const displayPlaying = optimisticPlaying !== null ? optimisticPlaying : (spotify?.isPlaying ?? false);

  const handlePlayPause = useCallback(() => {
    const next = !displayPlaying;
    setOptimisticPlaying(next);
    spotifyControl(next ? 'play' : 'pause');
    setTimeout(() => setOptimisticPlaying(null), 3_000);
  }, [displayPlaying]);

  if (!spotify?.track) {
    return (
      <div className="rounded-[14px] h-full flex items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #0d2b1a 0%, #0a1f13 100%)' }}>
        <div className="flex flex-col items-center gap-[8px]">
          <Music2 size={32} color="#1db954" style={{ opacity: 0.6 }} />
          <span className="text-[11px] text-cool-gray">Nada tocando</span>
        </div>
      </div>
    );
  }

  const pct = spotify.progressMs && spotify.durationMs
    ? (spotify.progressMs / spotify.durationMs) * 100
    : 0;

  const btnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', borderRadius: '50%',
    color: 'rgba(255,255,255,0.85)',
  };

  const coverSz = 'clamp(90px,23vh,140px)';

  return (
    <div className="rounded-[14px] h-full relative overflow-hidden flex items-center"
      style={{ padding: 'clamp(10px,2.5vh,16px) clamp(10px,1.5vw,14px)', gap: 'clamp(8px,1.5vw,12px)' }}>

      {/* Fundo: capa desfocada */}
      {spotify.coverUrl && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${spotify.coverUrl})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(4px)', transform: 'scale(1.02)', zIndex: 0,
        }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.58)', zIndex: 1 }} />

      {/* Capa — maior */}
      <div style={{ position: 'relative', flexShrink: 0, zIndex: 2 }}>
        {spotify.coverUrl ? (
          <img src={spotify.coverUrl} alt="Capa" style={{
            width: coverSz, height: coverSz,
            borderRadius: '10px', objectFit: 'cover',
            boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
          }} />
        ) : (
          <div style={{ width: coverSz, height: coverSz, borderRadius: '10px', background: 'linear-gradient(135deg,#1db954,#0a4d22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music2 size={28} color="#fff" />
          </div>
        )}
      </div>

      {/* Info + progresso + controles — compacto à direita */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 2 }}>

        <div style={{ fontSize: 'clamp(5px,0.9vh,7px)', fontWeight: 700, color: '#1db954', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Tocando agora
        </div>
        <div data-testid="spotify-track"
          style={{ fontSize: 'clamp(10px,1.9vh,15px)', fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {spotify.track}
        </div>
        <div data-testid="spotify-artist"
          style={{ fontSize: 'clamp(8px,1.3vh,11px)', color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {spotify.artist}{spotify.album ? ` · ${spotify.album}` : ''}
        </div>

        {/* Barra de progresso com bolinha na ponta */}
        <div style={{ marginTop: '6px' }}>
          <div style={{ position: 'relative', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.12)' }}>
            <div style={{ height: '3px', borderRadius: '2px', width: `${pct}%`, background: '#1db954', transition: 'width 1s linear' }} />
            {/* Bolinha discreta na ponta */}
            <div style={{
              position: 'absolute', top: '50%',
              left: `${pct}%`,
              transform: 'translate(-50%, -50%)',
              width: '7px', height: '7px',
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 0 3px rgba(0,0,0,0.4)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
            <span data-testid="spotify-current" style={{ fontSize: '6px', color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>
              {spotify.progressMs ? fmt(spotify.progressMs) : '0:00'}
            </span>
            <span data-testid="spotify-total" style={{ fontSize: '6px', color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>
              {spotify.durationMs ? fmt(spotify.durationMs) : '0:00'}
            </span>
          </div>
        </div>

        {/* Controles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', marginTop: '4px' }}>
          <button style={btnStyle} onClick={() => spotifyControl('prev')} aria-label="Anterior">
            <SkipBack size={20} />
          </button>
          <button
            style={{ ...btnStyle, background: 'rgba(255,255,255,0.14)', borderRadius: '50%', padding: '9px' }}
            onClick={handlePlayPause}
            aria-label={displayPlaying ? 'Pausar' : 'Tocar'}
          >
            {displayPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button style={btnStyle} onClick={() => spotifyControl('next')} aria-label="Próxima">
            <SkipForward size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
