'use client';

import { useDashboardStore } from '@/lib/store';

const ICONS: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌦️',
  95: '⛈️',
};

export function WeatherWidget() {
  const weather = useDashboardStore((s) => s.state.weather);

  if (!weather) {
    return (
      <div className="rounded-[10px] h-full flex items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #0c1e22 0%, #161618 100%)' }}>
        <span className="text-[8px] text-dark-charcoal">Carregando clima...</span>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] h-full flex flex-col justify-between p-[8px_10px]"
      style={{ background: 'linear-gradient(145deg, #0c1e22 0%, #161618 100%)' }}>
      <span className="text-[7px] font-semibold text-accent-teal uppercase tracking-[0.07em]">Clima</span>
      <div className="flex items-start gap-[6px]">
        <span className="text-[22px] leading-none">{ICONS[weather.conditionCode] ?? '🌡️'}</span>
        <div>
          <div data-testid="weather-temp"
            className="text-[22px] font-[300] text-cloud-white tracking-[-0.8px] leading-none">
            {Math.round(weather.temperature)}°C
          </div>
          <div className="text-[7.5px] text-cool-gray mt-[1px]">Sensação {Math.round(weather.feelsLike)}°C</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-[2px_8px]">
        <div className="text-[7px] text-dark-charcoal">Umidade <span className="text-cool-gray">{weather.humidity}%</span></div>
        <div className="text-[7px] text-dark-charcoal">Chuva <span className="text-cool-gray">{weather.rainChance}%</span></div>
        <div className="text-[7px] text-dark-charcoal">Vento <span className="text-cool-gray">{weather.windSpeed} km/h</span></div>
        <div className="text-[7px] text-dark-charcoal">Sensação <span className="text-cool-gray">{Math.round(weather.feelsLike)}°C</span></div>
      </div>
    </div>
  );
}
