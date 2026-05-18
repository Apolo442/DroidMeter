'use client';

import { useEffect, useState } from 'react';
import { initWebSocket } from '@/lib/websocket';
import { ClockWidget }      from './modules/clock/ClockWidget';
import { SpotifyWidget }    from './modules/spotify/SpotifyWidget';
import { WeatherWidget }    from './modules/weather/WeatherWidget';
import { HubHealthWidget }  from './modules/hub/HubHealthWidget';

export function Dashboard() {
  const [spotifyExpanded, setSpotifyExpanded] = useState(false);

  useEffect(() => { initWebSocket(); }, []);

  return (
    <div
      className={`dashboard-shell w-screen h-screen ${spotifyExpanded ? 'spotify-expanded' : ''}`}
      style={{
        padding: '8px 10px',
        display: 'grid',
        gridTemplateColumns: '32fr 68fr',
        gridTemplateRows: '58fr 42fr',
        gap: '10px',
      }}
    >
      {/* Col 1 */}
      <div className="dashboard-cell" style={{ gridColumn: 1, gridRow: 1, minHeight: 0 }}><ClockWidget /></div>
      <div className="dashboard-cell" style={{ gridColumn: 1, gridRow: 2, minHeight: 0 }}><HubHealthWidget /></div>

      {/* Col 2 */}
      <div
        className="dashboard-cell spotify-cell"
        style={{ gridColumn: 2, gridRow: 1, minHeight: 0 }}
      >
        <SpotifyWidget
          isExpanded={spotifyExpanded}
          onToggleExpanded={() => setSpotifyExpanded((value) => !value)}
        />
      </div>
      <div className="dashboard-cell" style={{ gridColumn: 2, gridRow: 2, minHeight: 0 }}><WeatherWidget /></div>
    </div>
  );
}
