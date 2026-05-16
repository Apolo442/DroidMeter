'use client';

import { useDashboardStore } from '@/lib/store';

function fmtUptime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

type Bar = { label: string; value: number; color: string; testId: string };

export function SystemWidget() {
  const system = useDashboardStore((s) => s.state.system);

  if (!system) {
    return (
      <div className="rounded-[10px] h-full flex items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #13101e 0%, #161618 100%)' }}>
        <span className="text-[8px] text-dark-charcoal">Carregando...</span>
      </div>
    );
  }

  const bars: Bar[] = [
    { label: 'CPU',   value: system.cpu,    color: '#2997ff', testId: 'system-cpu' },
    { label: 'RAM',   value: system.memory, color: '#ff9f0a', testId: 'system-memory' },
    { label: 'Disco', value: system.disk,   color: '#30d158', testId: 'system-disk' },
    ...(system.gpu != null
      ? [{ label: 'GPU', value: system.gpu, color: '#8668ff', testId: 'system-gpu' }]
      : []),
  ];

  return (
    <div className="rounded-[10px] h-full flex flex-col justify-between p-[8px_10px]"
      style={{ background: 'linear-gradient(145deg, #13101e 0%, #161618 100%)' }}>
      <span className="text-[7px] font-semibold text-neon-violet uppercase tracking-[0.07em]">Status do PC</span>
      <div className="flex flex-col gap-1">
        {bars.map(({ label, value, color, testId }) => (
          <div key={label} className="flex items-center gap-[5px]">
            <span className="text-[7.5px] text-cool-gray w-[24px] shrink-0">{label}</span>
            <div className="flex-1 h-[3px] rounded-full" style={{ background: '#1e1a2e' }}>
              <div className="h-[3px] rounded-full transition-all duration-500"
                style={{ width: `${value}%`, background: color }} />
            </div>
            <span data-testid={testId}
              className="text-[7px] text-[#aeaeb2] w-[22px] text-right tabular-nums">
              {value}%
            </span>
          </div>
        ))}
      </div>
      <div data-testid="system-uptime" className="text-[6.5px] text-dark-charcoal">
        ⏱ Uptime {fmtUptime(system.uptime)}
      </div>
    </div>
  );
}
