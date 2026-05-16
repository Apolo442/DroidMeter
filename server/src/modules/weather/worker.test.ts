import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWorker } from './worker.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const OPEN_METEO_RESPONSE = {
  current: {
    temperature_2m: 28.3,
    apparent_temperature: 31.1,
    relative_humidity_2m: 72,
    wind_speed_10m: 12.4,
    precipitation_probability: 15,
    weather_code: 3,
  },
};

describe('weather worker', () => {
  const updateState = vi.fn();
  const broadcast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(OPEN_METEO_RESPONSE) });
    process.env.WEATHER_LAT = '-12.2664';
    process.env.WEATHER_LON = '-38.9663';
  });

  it('faz request para Open-Meteo com lat/lon', async () => {
    await createWorker({ updateState, broadcast }).fetch();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('latitude=-12.2664'));
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('longitude=-38.9663'));
  });

  it('normaliza resposta e chama updateState', async () => {
    await createWorker({ updateState, broadcast }).fetch();
    expect(updateState).toHaveBeenCalledWith({
      weather: expect.objectContaining({
        temperature: 28.3, feelsLike: 31.1, humidity: 72,
        windSpeed: 12.4, rainChance: 15, conditionCode: 3,
      }),
    });
  });

  it('faz broadcast do evento weather:update', async () => {
    await createWorker({ updateState, broadcast }).fetch();
    expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ event: 'weather:update' }));
  });
});
