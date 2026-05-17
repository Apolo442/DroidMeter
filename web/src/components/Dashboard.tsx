'use client';

import { useEffect } from 'react';
import { initWebSocket } from '@/lib/websocket';
import { ClockWidget }      from './modules/clock/ClockWidget';
import { SpotifyWidget }    from './modules/spotify/SpotifyWidget';
import { WeatherWidget }    from './modules/weather/WeatherWidget';
import { SystemWidget }     from './modules/system/SystemWidget';
import { HubHealthWidget }  from './modules/hub/HubHealthWidget';

export function Dashboard() {
  useEffect(() => { initWebSocket(); }, []);

  return (
    <div
      className="w-screen h-screen"
      style={{
        padding: '8px 10px',
        display: 'grid',
        gridTemplateColumns: '25fr 60fr 15fr',
        gridTemplateRows: '58fr 42fr',
        gap: '10px',
      }}
    >
      {/* Col 1 */}
      <div style={{ gridColumn: 1, gridRow: 1, minHeight: 0 }}><ClockWidget /></div>
      <div style={{ gridColumn: 1, gridRow: 2, minHeight: 0 }}><HubHealthWidget /></div>

      {/* Col 2 */}
      <div style={{ gridColumn: 2, gridRow: 1, minHeight: 0 }}><SpotifyWidget /></div>
      <div style={{ gridColumn: 2, gridRow: 2, minHeight: 0 }}><WeatherWidget /></div>

      {/* Col 3 — sidebar, span 2 rows */}
      <div style={{ gridColumn: 3, gridRow: '1 / 3', minHeight: 0 }}><SystemWidget /></div>
    </div>
  );
}
