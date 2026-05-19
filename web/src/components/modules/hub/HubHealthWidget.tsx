'use client';
import { useDashboardStore } from '@/lib/store';

const ARC_LEN = 100.53;
const ARC_PATH = 'M 6,46 A 34,34 0 0,1 74,46';
const GREEN = '#2fa84d';

const STATUS_LABEL: Record<string, string> = {
  charging: 'Carregando',
  discharging: 'Descarregando',
  full: 'Completo',
  unknown: 'Desconhecido',
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatScreenUptime(seconds?: number) {
  if (seconds == null) return '--';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h${minutes.toString().padStart(2, '0')}`;
  return `${minutes}m`;
}

function temperaturePalette(temp?: number) {
  if (temp == null) return { from: '#2f8f3f', to: '#8fcf2f', text: '#9ccf48', label: '--' };
  if (temp >= 42) return { from: '#c87416', to: '#d64252', text: '#d9584d', label: 'Critico' };
  if (temp >= 38) return { from: '#93b93e', to: '#d08118', text: '#d2933e', label: 'Quente' };
  if (temp <= 28) return { from: '#2f8f3f', to: '#8fcf2f', text: '#9ccf48', label: 'Frio' };
  return { from: '#2f8f3f', to: '#c1a82a', text: '#9ccf48', label: 'OK' };
}

function Gauge({
  id,
  label,
  value,
  display,
  from,
  to,
  textColor,
}: {
  id: string;
  label: string;
  value: number;
  display: string;
  from: string;
  to: string;
  textColor: string;
}) {
  const offset = ARC_LEN * (1 - clamp(value, 0, 100) / 100);

  return (
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '90px' }}>
        <svg viewBox="0 0 80 54" style={{ width: '100%', display: 'block' }}>
          <defs>
            <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
          <path d={ARC_PATH} fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="7" strokeLinecap="round" />
          <path
            d={ARC_PATH}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={ARC_LEN}
            strokeDashoffset={offset}
          />
          <text x="40" y="34" textAnchor="middle" fontSize="12" fontWeight="800" fill={textColor}>{display}</text>
          <text x="40" y="45" textAnchor="middle" fontSize="6.2" fontWeight="700" fill="#8e8e93">{label}</text>
        </svg>
      </div>
    </div>
  );
}

function WifiBars({ rssi }: { rssi?: number }) {
  const level = rssi == null ? 0 : rssi >= -55 ? 4 : rssi >= -65 ? 3 : rssi >= -75 ? 2 : 1;
  const bars = [7, 11, 15, 19];

  return (
    <div style={{ display: 'flex', alignItems: 'end', gap: '3px', height: '20px', flexShrink: 0 }}>
      {bars.map((height, index) => {
        const active = index < level;
        return (
          <div
            key={height}
            style={{
              width: '6px',
              height,
              borderRadius: '4px 4px 2px 2px',
              background: active ? 'linear-gradient(180deg, #5ab0d0 0%, #2f73b7 100%)' : 'rgba(255,255,255,0.045)',
              boxShadow: 'none',
            }}
          />
        );
      })}
    </div>
  );
}

function statusColor(value?: number, warn = 70, danger = 85) {
  if (value == null) return '#86868b';
  if (value >= danger) return '#d9584d';
  if (value >= warn) return '#c1a82a';
  return GREEN;
}

function tempColor(temp?: number) {
  if (temp == null) return '#86868b';
  if (temp > 70) return '#d9584d';
  if (temp > 60) return '#c1a82a';
  return GREEN;
}

function pingColor(ms?: number) {
  if (ms == null) return '#86868b';
  if (ms >= 120) return '#d9584d';
  if (ms >= 60) return '#c1a82a';
  return GREEN;
}

function batteryStatusColor(status?: string, inputSuspended?: boolean) {
  if (inputSuspended) return '#c1a82a';
  if (status === 'charging' || status === 'full') return GREEN;
  if (status === 'discharging') return '#c1a82a';
  return '#86868b';
}

function InfoCard({ label, value, color = GREEN }: { label: string; value: string; color?: string }) {
  const valueParts = value.split(' / ');

  return (
    <div style={{
      minWidth: 0,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-evenly',
      gap: '0',
      padding: '4px 7px',
      borderRadius: '10px',
      background: 'rgba(255,255,255,0.028)',
      border: '1px solid rgba(255,255,255,0.035)',
      overflow: 'hidden',
    }}>
      <span style={{ color: '#86868b', fontSize: 'clamp(5.8px,0.8vh,7.2px)', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', lineHeight: 1, display: 'block' }}>
        {label}
      </span>
      <span style={{ color, fontSize: 'clamp(9px,1.28vh,11.5px)', fontWeight: 850, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1, display: 'block' }}>
        {valueParts.length === 2 ? (
          <>
            {valueParts[0]}
            <span style={{ display: 'inline-block', width: '1px', height: '0.9em', margin: '0 5px', background: 'rgba(255,255,255,0.1)', verticalAlign: '-0.12em' }} />
            {valueParts[1]}
          </>
        ) : value}
      </span>
    </div>
  );
}

export function HubHealthWidget() {
  const hub = useDashboardStore((s) => s.state.hub);

  const batteryPct = hub?.battery.level ?? 0;
  const batteryStatus = hub?.battery.inputSuspended ? 'Carga pausada' : hub ? (STATUS_LABEL[hub.battery.status] ?? '--') : '--';
  const batteryTemp = hub?.battery.temperature;
  const tempPalette = temperaturePalette(batteryTemp);
  const tempValue = batteryTemp == null ? 0 : ((clamp(batteryTemp, 20, 45) - 20) / 25) * 100;
  const screen = hub?.screen?.brightnessPercent != null ? `${hub.screen.brightnessPercent}%` : '--';
  const uptime = formatScreenUptime(hub?.screen?.onTimeSec);
  const wifiLabel = hub ? `${hub.wifi.signalLabel} - ${hub.wifi.latencyMs}ms` : '--';

  return (
    <div className="glass-widget h-full flex flex-col" style={{
      borderRadius: '14px 14px 14px 26px',
      padding: '6px 9px 7px',
      gap: '4px',
      minHeight: 0,
      overflow: 'hidden',
    }}>
      <div style={{ fontSize: 'clamp(6px,0.85vh,7.6px)', fontWeight: 800, color: '#48484a', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0, lineHeight: 1 }}>
        Saúde do Hub
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.9fr', alignItems: 'end', gap: '6px', flexShrink: 0, minHeight: 0 }}>
        <Gauge
          id="hub-battery-gauge"
          label="Bateria"
          value={batteryPct}
          display={`${batteryPct}%`}
          from="#2f8f3f"
          to="#8fcf2f"
          textColor="#9ccf48"
        />
        <Gauge
          id="hub-temp-gauge"
          label="Temp Bat"
          value={tempValue}
          display={batteryTemp != null ? `${batteryTemp}°` : '--'}
          from={tempPalette.from}
          to={tempPalette.to}
          textColor={tempPalette.text}
        />
        <div style={{ minWidth: 0, height: '54px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '7px', overflow: 'hidden' }}>
          <WifiBars rssi={hub?.wifi.rssi} />
          <div style={{ marginTop: '4px', maxWidth: '100%', fontSize: 'clamp(6.2px,0.86vh,7.7px)', color: '#5ab0d0', fontWeight: 850, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {wifiLabel}
          </div>
        </div>
      </div>

      <span style={{
        display: 'block',
        height: '1px',
        background: 'rgba(255,255,255,0.04)',
        margin: '2px 0',
        flexShrink: 0,
      }} />

      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: '5px',
        overflow: 'hidden',
      }}>
        <InfoCard label="Carga" value={batteryStatus} color={batteryStatusColor(hub?.battery.status, hub?.battery.inputSuspended)} />
        <InfoCard label="CPU" value={hub ? `${hub.cpuUsage ?? 0}% / ${hub.cpuTemp}°` : '--'} color={hub ? (tempColor(hub.cpuTemp) === GREEN ? statusColor(hub.cpuUsage) : tempColor(hub.cpuTemp)) : '#86868b'} />
        <InfoCard label="RAM" value={hub?.memoryUsedGb != null ? `${hub.memory}% / ${hub.memoryUsedGb.toFixed(1)}GB` : '--'} color={statusColor(hub?.memory, 75, 90)} />
        <InfoCard label="Tela" value={`${screen} / ${uptime}`} color={GREEN} />
      </div>
    </div>
  );
}
