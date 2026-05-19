'use client';

import { useCallback, useEffect, useState } from 'react';
import { initWebSocket } from '@/lib/websocket';
import { ClockWidget }      from './modules/clock/ClockWidget';
import { SpotifyWidget }    from './modules/spotify/SpotifyWidget';
import { WeatherWidget }    from './modules/weather/WeatherWidget';
import { HubHealthWidget }  from './modules/hub/HubHealthWidget';
import { SleepBar }         from './SleepBar';
import { OrientationGuard } from './OrientationGuard';
import { WakeAnimation }    from './WakeAnimation';
import { ControlPanel, type ControlPanelSettings } from './ControlPanel';

export function Dashboard() {
  const [spotifyExpanded, setSpotifyExpanded] = useState(false);
  const [controlSettings, setControlSettings] = useState<ControlPanelSettings | null>(null);
  const handleControlSettings = useCallback((settings: ControlPanelSettings) => {
    setControlSettings(settings);
  }, []);

  useEffect(() => { initWebSocket(); }, []);

  const shellClasses = [
    'dashboard-shell',
    'w-screen',
    'h-screen',
    spotifyExpanded ? 'spotify-expanded' : '',
    controlSettings?.nightMode ? 'control-night-mode' : '',
    controlSettings?.economyMode ? 'control-economy-mode' : '',
    controlSettings?.neutralTheme ? 'control-neutral-theme' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={shellClasses}
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

      <SleepBar />
      <ControlPanel onSettingsChange={handleControlSettings} />
      <OrientationGuard />
      <WakeAnimation />
    </div>
  );
}
