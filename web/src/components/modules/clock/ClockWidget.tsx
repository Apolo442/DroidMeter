'use client';

import { useState, useEffect } from 'react';

const DAYS_LONG = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const MONTHS    = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DOW       = ['D','S','T','Q','Q','S','S'];

function greeting(h: number) {
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function buildCalendar(year: number, month: number): (number | null)[] {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);
  return cells;
}

export function ClockWidget() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);

  const hh    = String(now.getHours()).padStart(2, '0');
  const mm    = String(now.getMinutes()).padStart(2, '0');
  const cells = buildCalendar(now.getFullYear(), now.getMonth());
  const today = now.getDate();

  const RED = '#FF3B30';
  const cameraCutoutMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath fill='white' d='M0 0 H100 V100 H17 C12 100 10 98 10 94 V81 C10 78 8 76 5 76 H5 C2 76 0 73 0 70 Z'/%3E%3C/svg%3E")`;

  return (
    <div
      className="glass-widget h-full flex flex-col"
      style={{
        borderRadius: '26px 14px 14px 14px',
        padding: 'clamp(12px,3vh,20px) clamp(14px,2.5vw,20px)',
        overflow: 'hidden',
        WebkitMaskImage: cameraCutoutMask,
        maskImage: cameraCutoutMask,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }}
    >
      {/* ── ÁREA SUPERIOR: hora ── */}
      <div style={{ flexShrink: 0 }}>
        {/* Saudação */}
        <div style={{
          fontSize: 'clamp(7px,1.1vh,9px)', fontWeight: 700,
          color: RED, textTransform: 'uppercase', letterSpacing: '0.12em',
          marginBottom: 'clamp(2px,0.6vh,5px)',
        }}>
          {greeting(now.getHours())}, Mateus
        </div>

        {/* Hora */}
        <div
          data-testid="clock-time"
          style={{
            fontSize: 'clamp(32px,11vh,52px)', fontWeight: 200,
            color: '#f5f5f7', lineHeight: 1, letterSpacing: '-2px',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {hh}:{mm}
        </div>

        {/* Data */}
        <div style={{
          fontSize: 'clamp(9px,1.5vh,12px)', color: '#86868b',
          marginTop: 'clamp(2px,0.5vh,4px)',
        }}>
          {DAYS_LONG[now.getDay()]}, {now.getDate()} de {MONTHS[now.getMonth()].toLowerCase()}
        </div>
      </div>

      {/* Divisor */}
      <div style={{
        height: '1px', background: 'rgba(255,255,255,0.08)',
        margin: 'clamp(6px,1.5vh,10px) 0', flexShrink: 0,
      }} />

      {/* ── ÁREA INFERIOR: calendário ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Mês */}
        <div style={{
          fontSize: 'clamp(7px,1.1vh,10px)', fontWeight: 700,
          color: RED, textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: 'clamp(2px,0.6vh,5px)', flexShrink: 0,
        }}>
          {MONTHS[now.getMonth()]}
        </div>

        {/* Cabeçalho DOW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', flexShrink: 0, marginBottom: '1px' }}>
          {DOW.map((d, i) => (
            <div key={i} style={{
              fontSize: 'clamp(6px,0.95vh,8px)', fontWeight: 600, textAlign: 'center',
              color: i === 0 || i === 6 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.35)',
              paddingBottom: '2px',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grade de dias */}
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridTemplateRows: 'repeat(6,1fr)',
          }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const isToday   = day === today;
              const col       = i % 7;
              const isWeekend = col === 0 || col === 6;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: 'clamp(13px,3.2vh,18px)', height: 'clamp(13px,3.2vh,18px)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'clamp(6px,1vh,9px)', fontWeight: isToday ? 700 : 500,
                    background: isToday ? RED : 'transparent',
                    color: isToday ? '#fff' : isWeekend ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)',
                  }}>
                    {day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
