import type { DashboardState, WeatherState } from '@shared/types.js';
import { WS_EVENTS } from '@shared/types.js';

type Deps = {
  updateState: (p: Partial<DashboardState>) => DashboardState;
  broadcast: (m: { event: string; data: unknown }) => void;
};

export function createWorker({ updateState, broadcast }: Deps) {
  return {
    intervalMs: 15 * 60 * 1000,

    async fetch() {
      const lat = process.env.WEATHER_LAT ?? '-12.2664';
      const lon = process.env.WEATHER_LON ?? '-38.9663';
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code` +
        `&hourly=temperature_2m,weather_code` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset` +
        `&forecast_days=4&timezone=auto`;

      const res = await globalThis.fetch(url);
      if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);

      type ApiResponse = {
        current: Record<string, number>;
        hourly: { time: string[]; temperature_2m: number[]; weather_code: number[] };
        daily: {
          time: string[];
          temperature_2m_max: number[];
          temperature_2m_min: number[];
          weather_code: number[];
          sunrise: string[];
          sunset: string[];
        };
      };
      const json = await res.json() as ApiResponse;
      const c = json.current;

      const nowHour = new Date().toISOString().slice(0, 13);
      const hourlyTimes = json.hourly?.time ?? [];
      const startIdx = hourlyTimes.findIndex((t) => t.startsWith(nowHour));
      const hourly = startIdx >= 0
        ? hourlyTimes.slice(startIdx, startIdx + 6).map((t, i) => ({
            time: t.slice(11, 16),
            temp: json.hourly.temperature_2m[startIdx + i],
            code: json.hourly.weather_code[startIdx + i],
          }))
        : [];

      const daily = (json.daily?.time ?? []).map((date, i) => ({
        date,
        tempMax: json.daily.temperature_2m_max[i],
        tempMin: json.daily.temperature_2m_min[i],
        code: json.daily.weather_code[i],
      }));

      const weather: WeatherState = {
        temperature: c.temperature_2m,
        feelsLike: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        windSpeed: c.wind_speed_10m,
        rainChance: c.precipitation_probability,
        conditionCode: c.weather_code,
        sunrise: json.daily?.sunrise?.[0]?.slice(11, 16),
        sunset: json.daily?.sunset?.[0]?.slice(11, 16),
        hourly,
        daily,
        updatedAt: new Date().toISOString(),
      };

      updateState({ weather });
      broadcast({ event: WS_EVENTS.WEATHER_UPDATE, data: { weather } });
    },
  };
}
