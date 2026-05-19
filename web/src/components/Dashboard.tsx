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

const BURN_IN_DIM_IDLE_MS = 20_000;

export function Dashboard() {
  const [spotifyExpanded, setSpotifyExpanded] = useState(false);
  const [controlSettings, setControlSettings] = useState<ControlPanelSettings | null>(null);
  const [burnInDimmed, setBurnInDimmed] = useState(false);
  const handleControlSettings = useCallback((settings: ControlPanelSettings) => {
    setControlSettings(settings);
  }, []);

  useEffect(() => { initWebSocket(); }, []);

  useEffect(() => {
    let dimTimer: number | null = null;

    function scheduleDim() {
      if (dimTimer) window.clearTimeout(dimTimer);
      setBurnInDimmed(false);
      dimTimer = window.setTimeout(() => setBurnInDimmed(true), BURN_IN_DIM_IDLE_MS);
    }

    const events = ['pointerdown', 'keydown', 'touchstart', 'visibilitychange'];
    events.forEach((event) => window.addEventListener(event, scheduleDim, { passive: true }));
    scheduleDim();

    return () => {
      if (dimTimer) window.clearTimeout(dimTimer);
      events.forEach((event) => window.removeEventListener(event, scheduleDim));
    };
  }, []);

  const shellClasses = [
    'dashboard-shell',
    'burn-in-protected',
    'w-screen',
    'h-screen',
    spotifyExpanded ? 'spotify-expanded' : '',
    burnInDimmed && !spotifyExpanded && (controlSettings?.idleScreenSaver || controlSettings?.autoSleep) ? 'burn-in-dimmed' : '',
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
