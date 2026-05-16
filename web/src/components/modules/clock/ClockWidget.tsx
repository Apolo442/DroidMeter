'use client';

import { useState, useEffect } from 'react';
import { useDashboardStore } from '@/lib/store';

const DAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function greeting(h: number) {
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function ClockWidget() {
  const [now, setNow] = useState(() => new Date());
  const weather = useDashboardStore((s) => s.state.weather);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const temp = weather?.temperature != null ? `${Math.round(weather.temperature)}°C` : null;

  return (
    <div
      className="rounded-[10px] h-full flex flex-col justify-between p-[10px_13px]"
      style={{ background: 'linear-gradient(150deg, #1c1c1e 0%, #161618 100%)' }}
    >
      <span className="text-[7.5px] font-semibold text-vivid-blue uppercase tracking-[0.07em]">
        {greeting(now.getHours())}, Mateus ☀️
      </span>
      <div>
        <div data-testid="clock-time"
          className="text-[30px] font-[200] text-cloud-white tabular-nums tracking-[-2px] leading-none">
          {hh}:{mm}
        </div>
        <div className="text-[9px] text-cool-gray mt-[3px]">
          {DAYS[now.getDay()]}, {now.getDate()} de {MONTHS[now.getMonth()]} de {now.getFullYear()}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[8px] text-dark-charcoal">📍 Feira de Santana, BA</span>
        {temp && (
          <>
            <div className="w-px h-2 bg-[#2a2a2e]" />
            <span data-testid="clock-weather" className="text-[8px] text-accent-teal">⛅ {temp}</span>
          </>
        )}
      </div>
    </div>
  );
}
