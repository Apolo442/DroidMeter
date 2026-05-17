'use client';

import { useDashboardStore } from '@/lib/store';

const LARGE_ARC_LEN = 163.36;
const LARGE_ARC_PATH = 'M 8,62 A 52,52 0 0,1 112,62';
const SEPARATOR_COLOR = '#3a3a3c';

type GaugeProps = {
  label: string;
  value: number;
  gradient: { from: string; to: string };
  textColor: string;
  testId: string;
  secondaryText?: string;
  separator?: string;
};

function Gauge({ label, value, gradient, textColor, testId, secondaryText, separator }: GaugeProps) {
  const offset = LARGE_ARC_LEN * (1 - value / 100);
  const gradientId = `system-${label.toLowerCase()}-gradient`;
  const hasSecondary = secondaryText != null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minHeight: 0, justifyContent: 'center', }}>
      <div style={{ width: '100%', maxWidth: 'clamp(78px, 100%, 120px)' }}>
        <svg viewBox="0 0 120 72" style={{ width: '100%', display: 'block' }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradient.from} />
              <stop offset="100%" stopColor={gradient.to} />
            </linearGradient>
          </defs>
          <path d={LARGE_ARC_PATH} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
          <path d={LARGE_ARC_PATH} fill="none" stroke={`url(#${gradientId})`} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={LARGE_ARC_LEN} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 600ms ease' }} />
          <text x="60" y="62" textAnchor="middle" fontSize="11.2" fontWeight="700" fill={textColor} data-testid={testId}>
            <tspan>{value}%</tspan>
            {hasSecondary && <tspan dx="4" fontSize="10" fill={SEPARATOR_COLOR}>{separator}</tspan>}
            {hasSecondary && <tspan dx="4">{secondaryText}</tspan>}
          </text>
        </svg>
      </div>
      <span style={{
        fontSize: 'clamp(7px,1.2vh,10px)', fontWeight: 800,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginTop: '1px', color: textColor,
      }}>
        {label}
      </span>
    </div>
  );
}

const SYSTEM_GRADIENTS = {
  cpu: { from: '#00BAF1', to: '#00FFCF', text: '#00BAF1' },
  memory: { from: '#37DB00', to: '#BCFF00', text: '#37DB00' },
  gpu: { from: '#F9104F', to: '#FF338A', text: '#F9104F' },
};

function fmtGb(value?: number) {
  if (value == null) return undefined;
  return `${Number.isInteger(value) ? value : value.toFixed(1)}GB`;
}

function GaugeDivider() {
  return (
    <span style={{
      display: 'block',
      width: '84%',
      height: '1px',
      margin: '-1px auto',
      background: 'rgba(255,255,255,0.07)',
      flexShrink: 0,
    }} />
  );
}

export function SystemWidget() {
  const system = useDashboardStore((s) => s.state.system);

  const cardStyle: React.CSSProperties = {
    borderRadius: '14px 32px 32px 14px',
  };

  if (!system) {
    return (
      <div className="glass-widget" style={{ ...cardStyle, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '10px', color: '#48484a' }}>...</span>
      </div>
    );
  }

  return (
    <div className="glass-widget" style={{ ...cardStyle, height: '100%', display: 'flex', flexDirection: 'column',
      padding: 'clamp(8px,2vh,14px) clamp(6px,1vw,12px)',
      gap: '4px',
    }}>

      <span style={{
        fontSize: 'clamp(6px,1vh,8px)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0,
        color: SYSTEM_GRADIENTS.cpu.text,
      }}>
        Sistema
      </span>

      <Gauge label="RAM" value={system.memory}   gradient={SYSTEM_GRADIENTS.memory} textColor={SYSTEM_GRADIENTS.memory.text} testId="system-memory" secondaryText={fmtGb(system.memoryUsedGb)} separator="|" />
      <GaugeDivider />
      <Gauge label="CPU" value={system.cpu}      gradient={SYSTEM_GRADIENTS.cpu} textColor={SYSTEM_GRADIENTS.cpu.text} testId="system-cpu" secondaryText={system.cpuTemp != null ? `${system.cpuTemp}°` : undefined} separator="|" />
      <GaugeDivider />
      <Gauge label="GPU" value={system.gpu ?? 0} gradient={SYSTEM_GRADIENTS.gpu} textColor={SYSTEM_GRADIENTS.gpu.text} testId="system-gpu" secondaryText={system.gpuTemp != null ? `${system.gpuTemp}°` : undefined} separator="|" />
    </div>
  );
}
