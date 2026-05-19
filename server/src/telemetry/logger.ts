import { appendFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { DashboardState, HubState, SpotifyState } from '@shared/types.js';

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
const HUB_STALE_MS = 2 * 60 * 1000;
const SECURITY_INTERVAL_MS = 5 * 60 * 1000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');

type TelemetryEvent = {
  ts: string;
  event: string;
  severity: 'info' | 'warn' | 'critical';
  [key: string]: unknown;
};

type PreviousState = {
  chargeSuspended?: boolean;
  spotifyPlaying?: boolean;
  spotifyTrack?: string;
  screenLikelyOn?: boolean;
  hubStale?: boolean;
  batteryTempBand?: string;
  cpuTempBand?: string;
  wifiLatencyBand?: string;
};

function telemetryDir() {
  return process.env.TELEMETRY_DIR
    ? resolve(process.env.TELEMETRY_DIR)
    : resolve(repoRoot, 'logs');
}

function intervalMs() {
  const raw = Number(process.env.TELEMETRY_INTERVAL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_INTERVAL_MS;
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

async function appendJsonl(kind: 'metrics' | 'events' | 'security', record: Record<string, unknown>) {
  const dir = telemetryDir();
  await mkdir(dir, { recursive: true });
  const path = resolve(dir, `${kind}-${dayKey()}.jsonl`);
  await appendFile(path, `${JSON.stringify(record)}\n`, 'utf8');
}

function secondsSince(iso?: string) {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.round((Date.now() - time) / 1000));
}

function round(value?: number, digits = 1) {
  if (value == null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function screenLikelyOn(hub?: HubState) {
  return hub?.screen.brightnessPercent != null && hub.screen.brightnessPercent > 0;
}

function batteryTempBand(temp?: number) {
  if (temp == null) return 'unknown';
  if (temp >= 42) return 'critical';
  if (temp >= 38) return 'warn';
  return 'ok';
}

function cpuTempBand(temp?: number) {
  if (temp == null) return 'unknown';
  if (temp > 70) return 'critical';
  if (temp > 60) return 'warn';
  return 'ok';
}

function wifiLatencyBand(ms?: number) {
  if (ms == null) return 'unknown';
  if (ms >= 500) return 'critical';
  if (ms >= 120) return 'warn';
  return 'ok';
}

function buildMetricRecord(state: DashboardState) {
  const hub = state.hub;
  const spotify = state.spotify;
  const hubAgeSec = secondsSince(hub?.updatedAt);
  const spotifyAgeSec = secondsSince(spotify?.updatedAt);

  return {
    ts: nowIso(),
    hubUpdatedAt: hub?.updatedAt ?? null,
    hubAgeSec,
    spotifyUpdatedAt: spotify?.updatedAt ?? null,
    spotifyAgeSec,

    batteryLevelPct: hub?.battery.level ?? null,
    batteryTempC: round(hub?.battery.temperature),
    batteryStatus: hub?.battery.status ?? null,
    batteryPlugged: hub?.battery.plugged ?? null,
    chargeSuspended: hub?.battery.inputSuspended ?? null,

    cpuUsagePct: round(hub?.cpuUsage),
    cpuTempC: round(hub?.cpuTemp),
    ramUsedPct: round(hub?.memory),
    ramUsedGb: round(hub?.memoryUsedGb),

    screenBrightnessPct: hub?.screen.brightnessPercent ?? null,
    screenOnTimeSec: hub?.screen.onTimeSec ?? null,
    screenOnTimeHours: hub?.screen.onTimeSec != null ? round(hub.screen.onTimeSec / 3600, 2) : null,
    screenLikelyOn: hub ? screenLikelyOn(hub) : null,

    wifiRssiDbm: hub?.wifi.rssi ?? null,
    wifiSignalLabel: hub?.wifi.signalLabel ?? null,
    wifiLatencyMs: hub?.wifi.latencyMs ?? null,
    wifiLinkSpeedMbps: hub?.wifi.linkSpeedMbps ?? null,

    spotifyIsPlaying: spotify?.isPlaying ?? null,
    spotifyTrack: spotify?.track ?? null,
    spotifyArtist: spotify?.artist ?? null,
    spotifyAlbum: spotify?.album ?? null,
    spotifyProgressMs: spotify?.progressMs ?? null,
    spotifyDurationMs: spotify?.durationMs ?? null,
  };
}

function eventForBand(
  prev: string | undefined,
  next: string,
  baseName: string,
  data: Record<string, unknown>
): TelemetryEvent | null {
  if (prev === next || next === 'unknown') return null;
  const severity = next === 'critical' ? 'critical' : next === 'warn' ? 'warn' : 'info';
  return { ts: nowIso(), event: `${baseName}_${next}`, severity, ...data };
}

function spotifyTrackKey(spotify?: SpotifyState) {
  if (!spotify?.track) return null;
  return [spotify.track, spotify.artist ?? '', spotify.album ?? ''].join('|');
}

function collectEvents(state: DashboardState, prev: PreviousState) {
  const events: TelemetryEvent[] = [];
  const hub = state.hub;
  const spotify = state.spotify;
  const hubAgeSec = secondsSince(hub?.updatedAt);
  const hubStale = hubAgeSec == null || hubAgeSec * 1000 > HUB_STALE_MS;
  const nextSpotifyTrack = spotifyTrackKey(spotify);

  if (hub) {
    const chargeSuspended = Boolean(hub.battery.inputSuspended);
    if (prev.chargeSuspended != null && prev.chargeSuspended !== chargeSuspended) {
      events.push({
        ts: nowIso(),
        event: chargeSuspended ? 'charge_suspended' : 'charge_resumed',
        severity: 'info',
        batteryLevelPct: hub.battery.level,
        batteryTempC: hub.battery.temperature,
      });
    }
    prev.chargeSuspended = chargeSuspended;

    const isScreenOn = screenLikelyOn(hub);
    if (prev.screenLikelyOn != null && prev.screenLikelyOn !== isScreenOn) {
      events.push({
        ts: nowIso(),
        event: isScreenOn ? 'screen_likely_on' : 'screen_likely_off',
        severity: 'info',
        screenBrightnessPct: hub.screen.brightnessPercent,
        screenOnTimeSec: hub.screen.onTimeSec,
      });
    }
    prev.screenLikelyOn = isScreenOn;

    const batteryBand = batteryTempBand(hub.battery.temperature);
    const batteryEvent = eventForBand(prev.batteryTempBand, batteryBand, 'battery_temp', {
      batteryTempC: hub.battery.temperature,
      batteryLevelPct: hub.battery.level,
    });
    if (batteryEvent) events.push(batteryEvent);
    prev.batteryTempBand = batteryBand;

    const cpuBand = cpuTempBand(hub.cpuTemp);
    const cpuEvent = eventForBand(prev.cpuTempBand, cpuBand, 'cpu_temp', {
      cpuTempC: hub.cpuTemp,
      cpuUsagePct: hub.cpuUsage,
    });
    if (cpuEvent) events.push(cpuEvent);
    prev.cpuTempBand = cpuBand;

    const latencyBand = wifiLatencyBand(hub.wifi.latencyMs);
    const latencyEvent = eventForBand(prev.wifiLatencyBand, latencyBand, 'wifi_latency', {
      wifiLatencyMs: hub.wifi.latencyMs,
      wifiRssiDbm: hub.wifi.rssi,
    });
    if (latencyEvent) events.push(latencyEvent);
    prev.wifiLatencyBand = latencyBand;
  }

  if (prev.hubStale != null && prev.hubStale !== hubStale) {
    events.push({
      ts: nowIso(),
      event: hubStale ? 'hub_data_stale' : 'hub_data_fresh',
      severity: hubStale ? 'warn' : 'info',
      hubAgeSec,
    });
  }
  prev.hubStale = hubStale;

  if (spotify) {
    if (prev.spotifyPlaying != null && prev.spotifyPlaying !== spotify.isPlaying) {
      events.push({
        ts: nowIso(),
        event: spotify.isPlaying ? 'spotify_started' : 'spotify_stopped',
        severity: 'info',
        spotifyTrack: spotify.track ?? null,
        spotifyArtist: spotify.artist ?? null,
      });
    }
    prev.spotifyPlaying = spotify.isPlaying;

    if (prev.spotifyTrack != null && nextSpotifyTrack != null && prev.spotifyTrack !== nextSpotifyTrack) {
      events.push({
        ts: nowIso(),
        event: 'spotify_track_changed',
        severity: 'info',
        spotifyTrack: spotify.track ?? null,
        spotifyArtist: spotify.artist ?? null,
        spotifyAlbum: spotify.album ?? null,
      });
    }
    prev.spotifyTrack = nextSpotifyTrack ?? prev.spotifyTrack;
  }

  return events;
}

function buildSecurityRecord(state: DashboardState) {
  const hubAgeSec = secondsSince(state.hub?.updatedAt);
  const spotifyAgeSec = secondsSince(state.spotify?.updatedAt);

  return {
    ts: nowIso(),
    kind: 'security_snapshot',
    processPid: process.pid,
    processUptimeSec: Math.round(process.uptime()),
    nodeEnv: process.env.NODE_ENV ?? null,
    telemetryDir: telemetryDir(),
    phoneSshHost: process.env.PHONE_HOST ?? '192.168.15.73',
    phoneSshPort: Number(process.env.PHONE_PORT ?? 8022),
    phoneSshUser: process.env.PHONE_USER ?? 'u0_a160',
    hubDataFresh: hubAgeSec != null && hubAgeSec * 1000 <= HUB_STALE_MS,
    hubAgeSec,
    spotifyDataFresh: spotifyAgeSec != null && spotifyAgeSec < 30,
    spotifyAgeSec,
    chargeSuspended: state.hub?.battery.inputSuspended ?? null,
    screenLikelyOn: state.hub ? screenLikelyOn(state.hub) : null,
    wifiSignalLabel: state.hub?.wifi.signalLabel ?? null,
    wifiLatencyMs: state.hub?.wifi.latencyMs ?? null,
  };
}

export function startTelemetry(getState: () => DashboardState) {
  const prev: PreviousState = {};
  let lastSecurityAt = 0;

  async function tick() {
    const state = getState();

    await appendJsonl('metrics', buildMetricRecord(state));

    const events = collectEvents(state, prev);
    for (const event of events) {
      await appendJsonl('events', event);
    }

    const now = Date.now();
    if (now - lastSecurityAt >= SECURITY_INTERVAL_MS) {
      await appendJsonl('security', buildSecurityRecord(state));
      lastSecurityAt = now;
    }
  }

  tick().catch((error) => {
    console.error('[telemetry] falha na coleta inicial', error);
  });

  const timer = setInterval(() => {
    tick().catch((error) => {
      console.error('[telemetry] falha na coleta', error);
    });
  }, intervalMs());

  console.log(`[telemetry] logs em ${telemetryDir()} (a cada ${intervalMs()}ms)`);
  return () => clearInterval(timer);
}
