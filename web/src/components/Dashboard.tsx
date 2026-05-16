'use client';

import { useEffect } from 'react';
import { ACTIVE_MODULES } from '@shared/modules.config';
import { initWebSocket } from '@/lib/websocket';
import { ClockWidget } from './modules/clock/ClockWidget';
import { SpotifyWidget } from './modules/spotify/SpotifyWidget';
import { WeatherWidget } from './modules/weather/WeatherWidget';
import { SystemWidget } from './modules/system/SystemWidget';
import { GitHubWidget } from './modules/github/GitHubWidget';

const WIDGET_MAP = {
  clock:   ClockWidget,
  spotify: SpotifyWidget,
  weather: WeatherWidget,
  system:  SystemWidget,
  github:  GitHubWidget,
} as const;

const TOP_SLOTS    = ['clock', 'spotify'] as const;
const BOTTOM_SLOTS = ['weather', 'system', 'github'] as const;

export function Dashboard() {
  useEffect(() => { initWebSocket(); }, []);

  const top    = TOP_SLOTS.filter((id) => (ACTIVE_MODULES as readonly string[]).includes(id));
  const bottom = BOTTOM_SLOTS.filter((id) => (ACTIVE_MODULES as readonly string[]).includes(id));

  return (
    <div
      className="w-screen h-screen bg-pitch-black p-[6px] grid gap-[6px]"
      style={{ gridTemplateRows: '44% 56%' }}
    >
      <div className="grid gap-[6px]" style={{ gridTemplateColumns: `repeat(${top.length}, 1fr)` }}>
        {top.map((id) => { const W = WIDGET_MAP[id]; return <W key={id} />; })}
      </div>
      <div className="grid gap-[6px]" style={{ gridTemplateColumns: `repeat(${bottom.length}, 1fr)` }}>
        {bottom.map((id) => { const W = WIDGET_MAP[id]; return <W key={id} />; })}
      </div>
    </div>
  );
}
