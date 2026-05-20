'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Battery,
  BatteryCharging,
  CloudSun,
  Gauge,
  MonitorOff,
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
import { markManualSleepWakePending, sleepScreen } from '@/lib/screen';
import { useDashboardStore } from '@/lib/store';

const STORAGE_KEY = 'droidmeter.controlPanel.v2';
const HARDWARE_DIM_IDLE_MS = 20_000;
const SCREEN_SAVER_IDLE_MS = 35_000;
const AUTO_SLEEP_IDLE_MS = 150_000;

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
  idleScreenSaver: true,
  autoSleep: true,
  nightMode: true,
  economyMode: true,
  diagnosticMode: false,
  neutralTheme: true,
  autoKiosk: true,
  brightness: 35,
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

function formatDiagNumber(value: number | undefined, unit = "", digits = 1) {
  if (value == null || !Number.isFinite(value)) return "--";
  return `${value.toFixed(digits)}${unit}`;
}

function formatDiagMilli(value: number | undefined, unit: string, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "--";
  return `${(value / 1000).toFixed(digits)}${unit}`;
}

function formatDiagAge(iso?: string) {
  if (!iso) return "--";
  return `${Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))}s`;
}

function DiagnosticOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const hub = useDashboardStore((store) => store.state.hub);
  const spotify = useDashboardStore((store) => store.state.spotify);
  const battery = hub?.battery;
  const usbPowerW = battery?.usbInputPowerW
    ?? (battery?.usbVoltageMv != null && battery?.usbInputCurrentMa != null
      ? (battery.usbVoltageMv * battery.usbInputCurrentMa) / 1_000_000
      : undefined);
  const batteryPowerW = battery?.batteryPowerW
    ?? (battery?.batteryVoltageMv != null && battery?.batteryCurrentMa != null && battery.batteryCurrentMa > 0
      ? (battery.batteryVoltageMv * battery.batteryCurrentMa) / 1_000_000
      : undefined);
  const batteryDischargePowerW = battery?.batteryDischargePowerW
    ?? (battery?.batteryVoltageMv != null && battery?.batteryCurrentMa != null && battery.batteryCurrentMa < 0
      ? (battery.batteryVoltageMv * Math.abs(battery.batteryCurrentMa)) / 1_000_000
      : undefined);
  const systemPowerW = battery?.systemPowerW
    ?? (usbPowerW != null || batteryPowerW != null || batteryDischargePowerW != null
      ? Math.max(0, (usbPowerW ?? 0) - (batteryPowerW ?? 0) + (batteryDischargePowerW ?? 0))
      : undefined);

  const wattItems = [
    { label: "Entrada", value: formatDiagNumber(usbPowerW, "W", 2) },
    { label: "Carga bat", value: formatDiagNumber(batteryPowerW, "W", 2) },
    { label: "Uso bat", value: formatDiagNumber(batteryDischargePowerW, "W", 2) },
    { label: "Sistema", value: formatDiagNumber(systemPowerW, "W", 2) },
  ];

  const detailItems = [
    { label: "USB", value: `${formatDiagMilli(battery?.usbVoltageMv, "V")} / ${formatDiagMilli(battery?.usbInputCurrentMa, "A")}` },
    { label: "Bat V/A", value: `${formatDiagMilli(battery?.batteryVoltageMv, "V")} / ${formatDiagMilli(battery?.batteryCurrentMa, "A")}` },
    { label: "Carga", value: battery?.inputSuspended ? "Pausada" : (battery?.chargeType ?? battery?.status ?? "--") },
    { label: "USB estado", value: battery?.usbOnline ? "Online" : battery?.usbPresent ? "Presente" : "Off" },
    { label: "Nível", value: battery ? `${battery.level}% / ${battery.temperature}°C` : "--" },
    { label: "Wi-Fi", value: hub ? `${hub.wifi.signalLabel} / ${hub.wifi.latencyMs}ms` : "--" },
    { label: "Hub", value: formatDiagAge(hub?.updatedAt) },
    { label: "Tela", value: hub ? `${hub.screen.brightnessPercent}%` : "--" },
  ];

  return (
    <div className={"diagnostic-overlay " + (open ? "is-open" : "")}>
      <button
        type="button"
        className="diagnostic-close-zone"
        onClick={onClose}
        aria-label="Fechar diagnóstico"
      />
      <div className="diagnostic-header">
        <span>Diagnóstico</span>
        <strong>{formatDiagNumber(usbPowerW, "W", 1)}</strong>
      </div>
      <div className="diagnostic-grid">
        <div className="diagnostic-watts">
          {wattItems.map((item) => (
            <div key={item.label} className="diagnostic-item diagnostic-watt-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
        <div className="diagnostic-details">
          {detailItems.map((item) => (
            <div key={item.label} className="diagnostic-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
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

function BlackoutTest({ onWake }: { onWake: () => void }) {
  useEffect(() => {
    const wake = () => onWake();
    const events = ['pointerdown', 'touchstart', 'keydown'];
    events.forEach((event) => window.addEventListener(event, wake, { once: true, passive: true }));
    return () => events.forEach((event) => window.removeEventListener(event, wake));
  }, [onWake]);

  return (
    <button
      type="button"
      className="blackout-test-overlay"
      onPointerDown={onWake}
      aria-label="Sair do teste preto"
    />
  );
}

export function ControlPanel({ onSettingsChange }: Props) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<ControlPanelSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [screenSaverVisible, setScreenSaverVisible] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [diagnosticVisible, setDiagnosticVisible] = useState(false);
  const [blackoutTestVisible, setBlackoutTestVisible] = useState(false);
  const idleTimer = useRef<number | null>(null);
  const dimTimer = useRef<number | null>(null);
  const sleepTimer = useRef<number | null>(null);
  const hardwareDimmed = useRef(false);
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
    if (settings.diagnosticMode) {
      setDiagnosticVisible(true);
      return;
    }

    const timer = window.setTimeout(() => setDiagnosticVisible(false), 360);
    return () => window.clearTimeout(timer);
  }, [settings.diagnosticMode]);

  useEffect(() => {
    if (!settingsLoaded || syncedAutoKiosk.current) return;
    syncedAutoKiosk.current = true;
    void runDeviceAction(settings.autoKiosk ? 'auto_kiosk_enable' : 'auto_kiosk_disable').catch(() => {});
  }, [settings.autoKiosk, settingsLoaded]);

  const applySettings = (patch: Partial<ControlPanelSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  };

  useEffect(() => {
    const screenProtectionEnabled = settings.idleScreenSaver || settings.autoSleep;

    function clearTimers() {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      if (dimTimer.current) window.clearTimeout(dimTimer.current);
      if (sleepTimer.current) window.clearTimeout(sleepTimer.current);
    }

    function schedule() {
      clearTimers();
      setScreenSaverVisible(false);

      if (hardwareDimmed.current) {
        hardwareDimmed.current = false;
        void runDeviceAction('brightness', settings.brightness).catch(() => {});
      }

      if (screenProtectionEnabled && settings.brightness > 8) {
        dimTimer.current = window.setTimeout(() => {
          hardwareDimmed.current = true;
          void runDeviceAction('brightness', 8).catch(() => {});
        }, HARDWARE_DIM_IDLE_MS);
      }

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
  }, [settings.autoSleep, settings.brightness, settings.idleScreenSaver]);

  const brightnessOptions = useMemo(() => [8, 15, 35, 60], []);

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
                detail="35s"
                tone="blue"
                onClick={() => applySettings({ idleScreenSaver: !settings.idleScreenSaver })}
              />
              <Tile
                active={settings.autoSleep}
                icon={Power}
                label="Auto tela"
                detail="2m30s"
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
              onClick={() => {
                markManualSleepWakePending();
                void execute('sleep_now', () => sleepScreen());
              }}
              aria-label="Dormir tela agora"
            >
              <Zap size={25} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              className="control-round control-blackout-test"
              onClick={() => {
                setOpen(false);
                setScreenSaverVisible(false);
                setBlackoutTestVisible(true);
              }}
              aria-label="Testar ghosting com preto real"
            >
              <MonitorOff size={22} strokeWidth={2.5} />
            </button>
          </div>
        </section>
      </div>

      {screenSaverVisible && <ScreenSaver onWake={() => setScreenSaverVisible(false)} />}
      {blackoutTestVisible && <BlackoutTest onWake={() => setBlackoutTestVisible(false)} />}
      {diagnosticVisible && <DiagnosticOverlay open={settings.diagnosticMode} onClose={() => applySettings({ diagnosticMode: false })} />}
    </>
  );
}
