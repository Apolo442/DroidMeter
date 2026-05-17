export type WeatherHour = { time: string; temp: number; code: number };
export type WeatherDay = { date: string; tempMin: number; tempMax: number; code: number };

export type WeatherState = {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  rainChance: number;
  conditionCode: number;
  sunrise?: string;
  sunset?: string;
  hourly?: WeatherHour[];
  daily?: WeatherDay[];
  updatedAt: string;
};

export type SpotifyState = {
  isPlaying: boolean;
  track?: string;
  artist?: string;
  album?: string;
  albumYear?: string;
  coverUrl?: string;
  progressMs?: number;
  durationMs?: number;
  updatedAt: string;
};

export type SystemState = {
  cpu: number;
  memory: number;
  disk: number;
  gpu?: number;
  cpuTemp?: number;
  gpuTemp?: number;
  uptime: number;
  updatedAt: string;
};

export type GitHubState = {
  commitsToday: number;
  openPRs: number;
  currentRepo?: string;
  currentBranch?: string;
  ciStatus: 'passing' | 'failing' | 'unknown';
  updatedAt: string;
};

export type DashboardState = {
  weather?: WeatherState;
  spotify?: SpotifyState;
  system?: SystemState;
  github?: GitHubState;
};

export const WS_EVENTS = {
  INIT: 'dashboard:init',
  WEATHER_UPDATE: 'weather:update',
  SPOTIFY_UPDATE: 'spotify:update',
  SYSTEM_UPDATE: 'system:update',
  GITHUB_UPDATE: 'github:update',
} as const;

export type WsEvent = typeof WS_EVENTS[keyof typeof WS_EVENTS];

export type WsMessage = {
  event: WsEvent;
  data: DashboardState | Partial<DashboardState>;
};
