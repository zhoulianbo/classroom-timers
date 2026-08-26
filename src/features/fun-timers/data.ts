export const funTimerKeys = [
  'bomb',
  'rainbow',
  'sand',
  'traffic',
  'candle',
  'egg',
  'popcorn',
] as const

export type FunTimerKey = (typeof funTimerKeys)[number]

export type FunTimerDefinition = {
  key: FunTimerKey
  path: string
  imagePath: string
  defaultSeconds: number
  maxSeconds?: number
  presets: readonly number[]
}

export const funTimers: readonly FunTimerDefinition[] = [
  {
    key: 'bomb',
    path: '/timer/bomb-timer',
    imagePath: '/images/fun-timers/bomb-timer.png',
    defaultSeconds: 60,
    presets: [10, 30, 60, 120, 300],
  },
  {
    key: 'rainbow',
    path: '/timer/rainbow-timer',
    imagePath: '/images/fun-timers/rainbow-timer.png',
    defaultSeconds: 600,
    maxSeconds: 3600,
    presets: [300, 600, 900, 1800, 3600],
  },
  {
    key: 'sand',
    path: '/timer/sand-timer',
    imagePath: '/images/fun-timers/sand-timer.png',
    defaultSeconds: 180,
    presets: [60, 180, 300, 600],
  },
  {
    key: 'traffic',
    path: '/timer/traffic-light-timer',
    imagePath: '/images/fun-timers/traffic-light-timer.png',
    defaultSeconds: 480,
    presets: [],
  },
  {
    key: 'candle',
    path: '/timer/candle-timer',
    imagePath: '/images/fun-timers/candle-timer.png',
    defaultSeconds: 1500,
    presets: [60, 300, 600, 900, 1500, 1800, 3600],
  },
  {
    key: 'egg',
    path: '/timer/egg-timer',
    imagePath: '/images/fun-timers/egg-timer.png',
    defaultSeconds: 360,
    presets: [180, 360, 540],
  },
  {
    key: 'popcorn',
    path: '/timer/popcorn-timer',
    imagePath: '/images/fun-timers/popcorn-timer.png',
    defaultSeconds: 180,
    presets: [120, 180, 240, 300],
  },
] as const

export function getFunTimer(key: FunTimerKey) {
  return funTimers.find((timer) => timer.key === key)!
}
