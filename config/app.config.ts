export const APP_CONFIG = {
  defaultRestSeconds: 90,
  rpeScale: { min: 1, max: 10 },
  sessionPhases: ['warmup', 'main', 'cooldown'] as const,
} as const;
