// Para desativar um módulo: comente a linha.
// O worker no backend e o card no frontend somem automaticamente.
export const ACTIVE_MODULES = [
  'clock',      // client-side apenas, sem worker
  'spotify',
  'weather',
  'system',
  // 'github',
] as const;

export type ModuleId = typeof ACTIVE_MODULES[number];
