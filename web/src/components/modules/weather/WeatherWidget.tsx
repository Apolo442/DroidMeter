'use client';

import { useDashboardStore } from '@/lib/store';
import {
  Sun, Moon, CloudSun, CloudMoon, CloudMoonRain, Cloud, CloudFog, CloudDrizzle,
  CloudRain, CloudSnow, CloudLightning, MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type WmoInfo = { Icon: LucideIcon; color: string; label: string };
type WeatherMode = 'day' | 'night' | 'cloudy';

const WEATHER_BACKGROUNDS: Record<WeatherMode, string> = {
  day: 'linear-gradient(180deg, #183152 0%, #255381 55%, #3c7298 100%)',
  night: 'linear-gradient(180deg, #02040f 0%, #1c263d 100%)',
  cloudy: 'linear-gradient(180deg, #3b4855 0%, #53616d 100%)',
};
const CORNER_REFRESH_GRAY = 'rgba(255,255,255,0.18)';

function ReloadButton() {
  return (
    <button
      type="button"
      aria-label="Recarregar dashboard"
      onClick={() => window.location.reload()}
      style={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: '42px',
        height: '42px',
        padding: 0,
        border: 0,
        borderRadius: '0 0 32px 0',
        background: 'transparent',
        cursor: 'pointer',
        opacity: 0.78,
      }}
    >
      <span style={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: '34px',
        height: '34px',
        borderRight: `9px solid ${CORNER_REFRESH_GRAY}`,
        borderBottom: `9px solid ${CORNER_REFRESH_GRAY}`,
        borderRadius: '0 0 32px 0',
        pointerEvents: 'none',
      }} />
    </button>
  );
}

function timeToMinutes(time?: string) {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function isNightTime(time: string, sunrise?: string, sunset?: string) {
  const current = timeToMinutes(time);
  const rise = timeToMinutes(sunrise);
  const set = timeToMinutes(sunset);
  if (current == null || rise == null || set == null) return false;
  return current < rise || current >= set;
}

function currentTimeHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function isCloudyOrWet(code: number) {
  return code === 3 || (code >= 45 && code <= 99);
}

function weatherMode(code: number, night: boolean): WeatherMode {
  if (isCloudyOrWet(code)) return 'cloudy';
  return night ? 'night' : 'day';
}

function wmoInfo(code: number, night = false): WmoInfo {
  const neutral = 'rgba(245,245,247,0.72)';
  const rain = night ? '#aabdd0' : '#a8c9dc';

  if (code === 0)  return night
    ? { Icon: Moon,     color: neutral, label: 'Limpo' }
    : { Icon: Sun,      color: '#c9ae2a', label: 'Ensolarado' };
  if (code <= 2)   return night
    ? { Icon: CloudMoon, color: neutral, label: 'Parcialmente nublado' }
    : { Icon: CloudSun,  color: '#c9ae2a', label: 'Parcialmente nublado' };
  if (code === 3)  return { Icon: Cloud,        color: neutral, label: 'Nublado' };
  if (code <= 48)  return { Icon: CloudFog,     color: '#c0c0c0', label: 'Neblina' };
  if (code <= 55)  return { Icon: night ? CloudMoonRain : CloudDrizzle, color: rain, label: 'Garoa' };
  if (code <= 65)  return { Icon: night ? CloudMoonRain : CloudRain,    color: rain, label: 'Chuvoso' };
  if (code <= 75)  return { Icon: CloudSnow,    color: neutral, label: 'Neve' };
  if (code <= 82)  return { Icon: night ? CloudMoonRain : CloudRain,    color: rain, label: 'Chuva forte' };
  return             { Icon: CloudLightning,    color: '#c9ae2a', label: 'Tempestade' };
}

export function WeatherWidget() {
  const weather = useDashboardStore((s) => s.state.weather);

  const bg = {
    borderRadius: '14px 14px 32px 14px',
    height: '100%',
    position: 'relative',
    background: WEATHER_BACKGROUNDS.day,
    border: '1px solid rgba(0,0,0,0.16)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.015)',
  } as const;

  if (!weather) {
    return (
      <div style={{ ...bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Carregando clima...</span>
        <ReloadButton />
      </div>
    );
  }

  const isCurrentNight = isNightTime(currentTimeHHMM(), weather.sunrise, weather.sunset);
  const mode = weatherMode(weather.conditionCode, isCurrentNight);
  const { Icon: CondIcon, color: condColor, label: condLabel } = wmoInfo(weather.conditionCode, mode === 'night');
  const hourly  = (weather.hourly ?? []).slice(0, 6);
  const todayD  = (weather.daily  ?? [])[0];
  const tempMax = todayD?.tempMax ?? null;
  const tempMin = todayD?.tempMin ?? null;

  return (
    <div style={{
      ...bg,
      background: WEATHER_BACKGROUNDS[mode],
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      padding: 'clamp(14px,3.2vh,20px) clamp(16px,2.8vw,24px)',
      overflow: 'hidden',
    }}>

      {/* ── ZONA SUPERIOR: condições atuais ── */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', minHeight: 0, alignItems: 'flex-start' }}>

        {/* Esquerda: temperatura | divisor vertical | cidade */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexShrink: 0, height: '100%' }}>
          <div data-testid="weather-temp" style={{
            fontSize: 'clamp(34px,11vh,58px)', fontWeight: 200,
            color: 'rgba(245,245,247,0.74)', lineHeight: 1, letterSpacing: 0, flexShrink: 0,
          }}>
            {Math.round(weather.temperature)}°
          </div>

          {/* Divisor vertical sutil */}
          <div style={{
            width: '1px', height: '36px',
            background: 'rgba(255,255,255,0.1)',
            margin: '0 12px', flexShrink: 0,
          }} />

          {/* Cidade centralizada verticalmente */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <MapPin size={13} color="rgba(255,255,255,0.42)" />
            <span style={{ fontSize: 'clamp(13px,2.2vh,17px)', fontWeight: 500, color: 'rgba(245,245,247,0.72)', whiteSpace: 'nowrap' }}>
              Feira de Santana
            </span>
          </div>
        </div>

        {/* Direita: ícone + condição + H/L */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' }}>
          <CondIcon size={32} color={condColor} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'clamp(2px,0.6vh,4px)' }}>
            <span style={{ fontSize: 'clamp(10px,1.8vh,13px)', fontWeight: 500, color: 'rgba(245,245,247,0.7)' }}>
              {condLabel}
            </span>
            {tempMax != null && tempMin != null && (
              <span style={{ fontSize: 'clamp(9px,1.5vh,12px)', fontWeight: 500, color: 'rgba(255,255,255,0.58)' }}>
                Max: {Math.round(tempMax)}° Mín: {Math.round(tempMin)}°
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── DIVISOR ── */}
      <div style={{
        height: '1px',
        background: 'rgba(255,255,255,0.11)',
        margin: 'clamp(10px,2.2vh,14px) 0',
        flexShrink: 0,
      }} />

      {/* ── ZONA INFERIOR: previsão horária ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        {hourly.length > 0 ? hourly.map((h, i) => {
          const isHourNight = isNightTime(h.time, weather.sunrise, weather.sunset);
          const { Icon: HIcon, color: hColor } = wmoInfo(h.code, isHourNight);
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
                color: 'rgba(255,255,255,0.48)',
              }}>
                {h.time}
              </span>
              <HIcon size={20} color={hColor} />
              <span style={{
                fontSize: 'clamp(12px,2vh,15px)',
                fontWeight: 500,
                color: 'rgba(245,245,247,0.68)',
              }}>
                {Math.round(h.temp)}°
              </span>
            </div>
          );
        }) : (
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Sem previsão</span>
        )}
      </div>

      <ReloadButton />
    </div>
  );
}
