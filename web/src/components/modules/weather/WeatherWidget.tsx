'use client';

import { useDashboardStore } from '@/lib/store';
import {
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle,
  CloudRain, CloudSnow, CloudLightning, MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type WmoInfo = { Icon: LucideIcon; color: string; label: string };

function wmoInfo(code: number): WmoInfo {
  if (code === 0)  return { Icon: Sun,          color: '#FFD60A', label: 'Ensolarado' };
  if (code <= 2)   return { Icon: CloudSun,     color: '#FFD60A', label: 'Parcialmente nublado' };
  if (code === 3)  return { Icon: Cloud,        color: '#ffffff', label: 'Nublado' };
  if (code <= 48)  return { Icon: CloudFog,     color: '#c0c0c0', label: 'Neblina' };
  if (code <= 55)  return { Icon: CloudDrizzle, color: '#a0d4ff', label: 'Garoa' };
  if (code <= 65)  return { Icon: CloudRain,    color: '#a0d4ff', label: 'Chuvoso' };
  if (code <= 75)  return { Icon: CloudSnow,    color: '#ffffff', label: 'Neve' };
  if (code <= 82)  return { Icon: CloudRain,    color: '#a0d4ff', label: 'Chuva forte' };
  return             { Icon: CloudLightning,    color: '#FFD60A', label: 'Tempestade' };
}

export function WeatherWidget() {
  const weather = useDashboardStore((s) => s.state.weather);

  const bg = {
    borderRadius: '14px',
    height: '100%',
    background: 'linear-gradient(160deg, #1b3d6b 0%, #2e6db4 55%, #5499d8 100%)',
    border: '1px solid rgba(255,255,255,0.10)',
  } as const;

  if (!weather) {
    return (
      <div style={{ ...bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Carregando clima...</span>
      </div>
    );
  }

  const { Icon: CondIcon, color: condColor, label: condLabel } = wmoInfo(weather.conditionCode);
  const hourly  = (weather.hourly ?? []).slice(0, 6);
  const todayD  = (weather.daily  ?? [])[0];
  const tempMax = todayD?.tempMax ?? null;
  const tempMin = todayD?.tempMin ?? null;

  return (
    <div style={{
      ...bg,
      display: 'flex',
      flexDirection: 'column',
      padding: 'clamp(14px,3.2vh,20px) clamp(16px,2.8vw,24px)',
      overflow: 'hidden',
    }}>

      {/* ── ZONA SUPERIOR: condições atuais ── */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', minHeight: 0, alignItems: 'flex-start' }}>

        {/* Esquerda: temperatura | divisor vertical | cidade */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexShrink: 0, height: '100%' }}>
          <div data-testid="weather-temp" style={{
            fontSize: 'clamp(34px,11vh,58px)', fontWeight: 200,
            color: '#ffffff', lineHeight: 1, letterSpacing: '-3px', flexShrink: 0,
          }}>
            {Math.round(weather.temperature)}°
          </div>

          {/* Divisor vertical sutil */}
          <div style={{
            width: '1px', height: '36px',
            background: 'rgba(255,255,255,0.18)',
            margin: '0 12px', flexShrink: 0,
          }} />

          {/* Cidade centralizada verticalmente */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <MapPin size={13} color="rgba(255,255,255,0.6)" />
            <span style={{ fontSize: 'clamp(13px,2.2vh,17px)', fontWeight: 500, color: '#ffffff', whiteSpace: 'nowrap' }}>
              Feira de Santana
            </span>
          </div>
        </div>

        {/* Direita: ícone + condição + H/L */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' }}>
          <CondIcon size={32} color={condColor} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'clamp(2px,0.6vh,4px)' }}>
            <span style={{ fontSize: 'clamp(10px,1.8vh,13px)', fontWeight: 500, color: '#ffffff' }}>
              {condLabel}
            </span>
            {tempMax != null && tempMin != null && (
              <span style={{ fontSize: 'clamp(9px,1.5vh,12px)', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                Max: {Math.round(tempMax)}° Mín: {Math.round(tempMin)}°
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── DIVISOR ── */}
      <div style={{
        height: '1px',
        background: 'rgba(255,255,255,0.22)',
        margin: 'clamp(10px,2.2vh,14px) 0',
        flexShrink: 0,
      }} />

      {/* ── ZONA INFERIOR: previsão horária ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        {hourly.length > 0 ? hourly.map((h, i) => {
          const { Icon: HIcon, color: hColor } = wmoInfo(h.code);
          return (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(3px,0.9vh,5px)',
            }}>
              {/* Hora — sem bold (único elemento sem bold) */}
              <span style={{
                fontSize: 'clamp(9px,1.6vh,12px)',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.7)',
              }}>
                {h.time}
              </span>
              <HIcon size={20} color={hColor} />
              <span style={{
                fontSize: 'clamp(12px,2vh,15px)',
                fontWeight: 500,
                color: '#ffffff',
              }}>
                {Math.round(h.temp)}°
              </span>
            </div>
          );
        }) : (
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Sem previsão</span>
        )}
      </div>

    </div>
  );
}
