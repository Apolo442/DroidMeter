'use client';
import { Wifi, Thermometer, Monitor } from 'lucide-react';

const ARC_LEN  = 100.53;
const ARC_PATH = 'M 8,44 A 32,32 0 0,1 72,44';
const GREEN    = '#30d158';

function BatteryGauge({ pct }: { pct: number }) {
  const offset = ARC_LEN * (1 - pct / 100);
  return (
    <div style={{ width: 'clamp(52px, 10vw, 72px)', flexShrink: 0 }}>
      <svg viewBox="0 0 80 52" style={{ width: '100%', display: 'block' }}>
        <path d={ARC_PATH} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" strokeLinecap="round" />
        <path d={ARC_PATH} fill="none" stroke={GREEN} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={ARC_LEN} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 4px ${GREEN}88)` }} />
        <text x="40" y="44" textAnchor="middle" fontSize="13" fontWeight="700" fill={GREEN}>{pct}%</text>
      </svg>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ color: '#48484a', display: 'flex', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 'clamp(7px,1.1vh,9px)', color: '#636366', flexShrink: 0, width: '28px' }}>{label}</span>
      <span style={{ fontSize: 'clamp(7px,1.1vh,9px)', color: GREEN, fontWeight: 600, flex: 1, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export function HubHealthWidget() {
  return (
    <div className="glass-widget h-full flex flex-col" style={{ borderRadius: '14px 14px 14px 26px',
      padding: 'clamp(8px,2vh,14px) clamp(10px,2vw,16px)',
      gap: 'clamp(4px,1vh,8px)',
    }}>
      <div style={{ fontSize: 'clamp(7px,1.1vh,9px)', fontWeight: 700, color: '#48484a', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>
        Saúde do Hub
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
        <BatteryGauge pct={82} />
        <div style={{ paddingBottom: '6px' }}>
          <div style={{ fontSize: 'clamp(9px,1.5vh,12px)', fontWeight: 700, color: GREEN, lineHeight: 1.2 }}>Bateria</div>
          <div style={{ fontSize: 'clamp(7px,1.1vh,9px)', color: '#636366' }}>Carregando</div>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', minHeight: 0 }}>
        <Row icon={<Thermometer size={10} />} label="Temp"  value="34.8°C" />
        <Row icon={<Monitor     size={10} />} label="Tela"  value="45% 01h32" />
        <Row icon={<Wifi        size={10} />} label="Wi-Fi" value="Forte 3ms" />
      </div>
    </div>
  );
}
