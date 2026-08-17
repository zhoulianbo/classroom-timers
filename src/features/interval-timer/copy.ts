import type { IntervalConfig, IntervalPreset, IntervalVariant } from './types'

const variantDefaults: Record<IntervalVariant, IntervalConfig> = {
  interval: { name: '', workSeconds: 60, restSeconds: 30, rounds: 5, warmupSeconds: 0, cooldownSeconds: 0, startWithRest: false, alertMode: 'beeps3' },
  hiit: { name: '', workSeconds: 40, restSeconds: 20, rounds: 8, warmupSeconds: 0, cooldownSeconds: 0, startWithRest: false, alertMode: 'beepsWarning' },
  tabata: { name: '', workSeconds: 20, restSeconds: 10, rounds: 8, warmupSeconds: 0, cooldownSeconds: 0, startWithRest: false, alertMode: 'beeps3' },
}

export const variantPresets: Record<IntervalVariant, IntervalPreset[]> = {
  interval: [
    { key: 'workRest', workSeconds: 60, restSeconds: 30, rounds: 5 },
    { key: 'fortyTwenty', workSeconds: 40, restSeconds: 20, rounds: 8 },
    { key: 'classroom', workSeconds: 600, restSeconds: 120, rounds: 4 },
    { key: 'circuit', workSeconds: 30, restSeconds: 30, rounds: 10 },
  ],
  hiit: [
    { key: 'classic', workSeconds: 40, restSeconds: 20, rounds: 8 },
    { key: 'quick', workSeconds: 30, restSeconds: 15, rounds: 10 },
    { key: 'power', workSeconds: 45, restSeconds: 15, rounds: 8 },
  ],
  tabata: [
    { key: 'classic', workSeconds: 20, restSeconds: 10, rounds: 8 },
    { key: 'fortyTwenty', workSeconds: 40, restSeconds: 20, rounds: 8 },
    { key: 'beginner', workSeconds: 20, restSeconds: 20, rounds: 6 },
    { key: 'extended', workSeconds: 20, restSeconds: 10, rounds: 12 },
  ],
}

export function getIntervalDefaults(variant: IntervalVariant) {
  return { ...variantDefaults[variant] }
}
