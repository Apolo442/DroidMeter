'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Battery,
  BatteryCharging,
  CloudSun,
  Gauge,
  Moon,
  Power,
  Settings,
  Shield,
  Smartphone,
  Sun,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { runDeviceAction } from '@/lib/device-actions';
import { sleepScreen } from '@/lib/screen';
import { useDashboardStore } from '@/lib/store';

const STORAGE_KEY = 'droidmeter.controlPanel';
const SCREEN_SAVER_IDLE_MS = 60_000;
const AUTO_SLEEP_IDLE_MS = 180_000;

export type ControlPanelSettings = {
  idleScreenSaver: boolean;
  autoSleep: boolean;
  nightMode: boolean;
  economyMode: boolean;
  diagnosticMode: boolean;
  neutralTheme: boolean;
  autoKiosk: boolean;
  brightness: number;
};

const DEFAULT_SETTINGS: ControlPanelSettings = {
  idleScreenSaver: false,
  autoSleep: false,
  nightMode: false,
  economyMode: false,
  diagnosticMode: false,
  neutralTheme: false,
  autoKiosk: true,
  brightness: 50,
};

type Props = {
  onSettingsChange: (settings: ControlPanelSettings) => void;
};

type TileProps = {
  active?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  detail?: string;
  tone?: 'blue' | 'green' | 'orange' | 'red' | 'gray';
  onClick: () => void;
};

function loadSettings(): ControlPanelSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function Tile({ active, disabled, icon: Icon, label, detail, tone = 'gray', onClick }: TileProps) {
  return (
    <button
      type="button"
      className={`control-tile ${active ? 'is-active' : ''} tone-${tone}`}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="control-tile-icon"><Icon size={22} strokeWidth={2.4} /></span>
      <span className="control-tile-text">
        <span>{label}</span>
        {detail && <small>{detail}</small>}
      </span>
    </button>
  );
}

function DiagnosticOverlay() {
  const hub = useDashboardStore((store) => store.state.hub);
  const spotify = useDashboardStore((store) => store.state.spotify);
  const hubAge = hub?.updatedAt
    ? Math.max(0, Math.round((Date.now() - new Date(hub.updatedAt).getTime()) / 1000))
    : null;
  const spotifyAge = spotify?.updatedAt
    ? Math.max(0, Math.round((Date.now() - new Date(spotify.updatedAt).getTime()) / 1000))
    : null;

  return (
    <div className="diagnostic-overlay">
      <span>Hub {hubAge == null ? '--' : `${hubAge}s`}</span>
      <span>{hub?.battery.level ?? '--'}%</span>
      <span>{hub?.battery.temperature ?? '--'}°C</span>
      <span>{hub?.wifi.signalLabel ?? '--'}</span>
      <span>Spotify {spotifyAge == null ? '--' : `${spotifyAge}s`}</span>
    </div>
  );
}

function ScreenSaver({ onWake }: { onWake: () => void }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <button type="button" className="screen-saver-overlay" onPointerDown={onWake}>
      <span className="screen-saver-clock">
        {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className="screen-saver-date">
        {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
      </span>
    </button>
  );
}

export function ControlPanel({ onSettingsChange }: Props) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<ControlPanelSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [screenSaverVisible, setScreenSaverVisible] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const idleTimer = useRef<number | null>(null);
  const sleepTimer = useRef<number | null>(null);
  const syncedAutoKiosk = useRef(false);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    onSettingsChange(loaded);
    setSettingsLoaded(true);
  }, [onSettingsChange]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    onSettingsChange(settings);
  }, [onSettingsChange, settings]);

  useEffect(() => {
    if (!settingsLoaded || syncedAutoKiosk.current) return;
    syncedAutoKiosk.current = true;
    void runDeviceAction(settings.autoKiosk ? 'auto_kiosk_enable' : 'auto_kiosk_disable').catch(() => {});
  }, [settings.autoKiosk, settingsLoaded]);

  const applySettings = (patch: Partial<ControlPanelSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  };

  useEffect(() => {
    function clearTimers() {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      if (sleepTimer.current) window.clearTimeout(sleepTimer.current);
    }

    function schedule() {
      clearTimers();
      setScreenSaverVisible(false);

      if (settings.idleScreenSaver) {
        idleTimer.current = window.setTimeout(() => {
          setOpen(false);
          setScreenSaverVisible(true);
        }, SCREEN_SAVER_IDLE_MS);
      }

      if (settings.autoSleep) {
        sleepTimer.current = window.setTimeout(() => {
          setOpen(false);
          setScreenSaverVisible(false);
          void sleepScreen();
        }, AUTO_SLEEP_IDLE_MS);
      }
    }

    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, schedule, { passive: true }));
    schedule();

    return () => {
      clearTimers();
      events.forEach((event) => window.removeEventListener(event, schedule));
    };
  }, [settings.autoSleep, settings.idleScreenSaver]);

  const brightnessOptions = useMemo(() => [15, 35, 60, 100], []);

  async function execute(action: string, run: () => Promise<void>) {
    setBusyAction(action);
    try {
      await run();
    } finally {
      setBusyAction(null);
    }
  }

  async function setBrightness(value: number) {
    applySettings({ brightness: value });
    await execute(`brightness-${value}`, () => runDeviceAction('brightness', value));
  }

  async function setAutoKiosk(value: boolean) {
    applySettings({ autoKiosk: value });
    await execute(
      value ? 'auto_kiosk_enable' : 'auto_kiosk_disable',
      () => runDeviceAction(value ? 'auto_kiosk_enable' : 'auto_kiosk_disable'),
    );
  }

  return (
    <>
      <button
        type="button"
        className={`control-panel-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-label="Abrir painel de controle"
      >
        <Settings size={18} strokeWidth={2.6} />
      </button>

      <div
        className={`control-panel-layer ${open ? 'is-open' : ''}`}
        onPointerDown={() => setOpen(false)}
        aria-hidden={!open}
      >
        <section className="control-panel" onPointerDown={(event) => event.stopPropagation()}>
          <div className="control-panel-grabber" />

          <div className="control-panel-grid">
            <div className="control-cluster connectivity-cluster">
              <Tile
                active={settings.idleScreenSaver}
                icon={Moon}
                label="Idle"
                detail="protege tela"
                tone="blue"
                onClick={() => applySettings({ idleScreenSaver: !settings.idleScreenSaver })}
              />
              <Tile
                active={settings.autoSleep}
                icon={Power}
                label="Auto tela"
                detail="dorme em 3 min"
                tone="orange"
                onClick={() => applySettings({ autoSleep: !settings.autoSleep })}
              />
              <Tile
                active={settings.nightMode}
                icon={Moon}
                label="Noite"
                detail="visual escuro"
                tone="gray"
                onClick={() => applySettings({ nightMode: !settings.nightMode })}
              />
              <Tile
                active={settings.economyMode}
                icon={Gauge}
                label="Eco"
                detail="leve"
                tone="green"
                onClick={() => applySettings({ economyMode: !settings.economyMode })}
              />
            </div>

            <div className="control-cluster action-cluster">
              <Tile
                icon={Battery}
                label="Pausar"
                detail="carga"
                tone="red"
                disabled={busyAction === 'charge_pause'}
                onClick={() => execute('charge_pause', () => runDeviceAction('charge_pause'))}
              />
              <Tile
                icon={BatteryCharging}
                label="Retomar"
                detail="carga"
                tone="green"
                disabled={busyAction === 'charge_resume'}
                onClick={() => execute('charge_resume', () => runDeviceAction('charge_resume'))}
              />
              <Tile
                icon={Smartphone}
                label="Kiosk"
                detail="corrigir tela"
                tone="blue"
                disabled={busyAction === 'kiosk_fix'}
                onClick={() => execute('kiosk_fix', () => runDeviceAction('kiosk_fix'))}
              />
              <Tile
                active={settings.diagnosticMode}
                icon={Activity}
                label="Diag"
                detail="status real"
                tone="orange"
                onClick={() => applySettings({ diagnosticMode: !settings.diagnosticMode })}
              />
            </div>

            <div className="control-slider">
              <Sun size={22} strokeWidth={2.4} />
              <div className="brightness-steps">
                {brightnessOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={settings.brightness === value ? 'is-selected' : ''}
                    onClick={() => void setBrightness(value)}
                    disabled={busyAction === `brightness-${value}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={`control-wide control-auto-kiosk ${settings.autoKiosk ? 'is-active' : ''}`}
              onClick={() => void setAutoKiosk(!settings.autoKiosk)}
              disabled={busyAction === 'auto_kiosk_enable' || busyAction === 'auto_kiosk_disable'}
              aria-pressed={settings.autoKiosk}
            >
              <span><Shield size={23} strokeWidth={2.4} /></span>
              <strong>{settings.autoKiosk ? 'Auto kiosk' : 'Kiosk livre'}</strong>
            </button>

            <button
              type="button"
              className={`control-wide control-theme-toggle ${settings.neutralTheme ? 'is-active' : ''}`}
              onClick={() => applySettings({ neutralTheme: !settings.neutralTheme })}
              aria-pressed={settings.neutralTheme}
            >
              <span><CloudSun size={24} strokeWidth={2.4} /></span>
              <strong>{settings.neutralTheme ? 'Tema neutro' : 'Tema clima'}</strong>
            </button>

            <button
              type="button"
              className="control-round"
              onClick={() => void execute('sleep_now', () => sleepScreen())}
              aria-label="Dormir tela agora"
            >
              <Zap size={25} strokeWidth={2.5} />
            </button>
          </div>
        </section>
      </div>

      {screenSaverVisible && <ScreenSaver onWake={() => setScreenSaverVisible(false)} />}
      {settings.diagnosticMode && <DiagnosticOverlay />}
    </>
  );
}
