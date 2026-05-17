'use client';

import { useDashboardStore } from '@/lib/store';
import { Timer } from 'lucide-react';

function fmtUptime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2,'0')}h${String(m).padStart(2,'0')}`;
}

const LARGE_ARC_LEN = 119.38;
const LARGE_ARC_PATH = 'M 10,52 A 38,38 0 0,1 86,52';

type GaugeProps = {
  label: string;
  value: number;
  gradient: { from: string; to: string };
  testId: string;
  temp?: number;
};

function GradientText({
  children,
  gradient,
  style,
}: {
  children: React.ReactNode;
  gradient: GaugeProps['gradient'];
  style?: React.CSSProperties;
}) {
  return (
    <span style={{
      background: `linear-gradient(90deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      ...style,
    }}>
      {children}
    </span>
  );
}

function Gauge({ label, value, gradient, testId, temp }: GaugeProps) {
  const offset = LARGE_ARC_LEN * (1 - value / 100);
  const gradientId = `system-${label.toLowerCase()}-gradient`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minHeight: 0, justifyContent: 'center', }}>
      <div style={{ width: '100%', maxWidth: 'clamp(62px, 92%, 96px)' }}>
        <svg viewBox="0 0 96 62" style={{ width: '100%', display: 'block' }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradient.from} />
              <stop offset="100%" stopColor={gradient.to} />
            </linearGradient>
          </defs>
          <path d={LARGE_ARC_PATH} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
          <path d={LARGE_ARC_PATH} fill="none" stroke={`url(#${gradientId})`} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={LARGE_ARC_LEN} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 600ms ease', filter: `drop-shadow(0 0 4px ${gradient.to}99)` }} />
          <text x="48" y="52" textAnchor="middle" fontSize="12" fontWeight="700" fill={`url(#${gradientId})`} data-testid={testId}>
            {value}%{temp != null ? ` ${temp}°` : ''}
          </text>
        </svg>
      </div>
      <GradientText gradient={gradient} style={{
        fontSize: 'clamp(6px,1vh,9px)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginTop: '1px',
      }}>
        {label}
      </GradientText>
    </div>
  );
}

const SYSTEM_GRADIENTS = {
  cpu: { from: '#00BAF1', to: '#00FFCF' },
  memory: { from: '#37DB00', to: '#BCFF00' },
  gpu: { from: '#E20014', to: '#FF338A' },
};

export function SystemWidget() {
  const system = useDashboardStore((s) => s.state.system);

  const cardStyle: React.CSSProperties = {
    borderRadius: '14px 32px 32px 14px',
    backgroundImage: 'url(/system-background.png)',
    backgroundSize: '120%',
    backgroundPosition: 'center',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.35)',
  };

  if (!system) {
    return (
      <div style={{ ...cardStyle, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '10px', color: '#48484a' }}>...</span>
      </div>
    );
  }

  return (
    <div style={{ ...cardStyle, height: '100%', display: 'flex', flexDirection: 'column',
      padding: 'clamp(8px,2vh,14px) clamp(6px,1vw,12px)',
      gap: '4px',
    }}>

      <GradientText gradient={SYSTEM_GRADIENTS.cpu} style={{
        fontSize: 'clamp(6px,1vh,8px)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0,
      }}>
        Sistema
      </GradientText>

      <Gauge label="CPU" value={system.cpu}      gradient={SYSTEM_GRADIENTS.cpu} testId="system-cpu" temp={system.cpuTemp} />
      <Gauge label="RAM" value={system.memory}   gradient={SYSTEM_GRADIENTS.memory} testId="system-memory" />
      <Gauge label="GPU" value={system.gpu ?? 0} gradient={SYSTEM_GRADIENTS.gpu} testId="system-gpu" temp={system.gpuTemp} />

      <div data-testid="system-uptime" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        fontSize: 'clamp(6px,1vh,8px)', color: '#3a3a3c', flexShrink: 0, position: 'relative', zIndex: 1,
      }}>
        <Timer size={8} color="#3a3a3c" />
        {fmtUptime(system.uptime)}
      </div>
    </div>
  );
}
