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
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code`;

      const res = await globalThis.fetch(url);
      if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);

      const json = await res.json() as { current: Record<string, number> };
      const c = json.current;

      const weather: WeatherState = {
        temperature: c.temperature_2m,
        feelsLike: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        windSpeed: c.wind_speed_10m,
        rainChance: c.precipitation_probability,
        conditionCode: c.weather_code,
        updatedAt: new Date().toISOString(),
      };

      updateState({ weather });
      broadcast({ event: WS_EVENTS.WEATHER_UPDATE, data: { weather } });
    },
  };
}
