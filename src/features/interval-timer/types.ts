export type IntervalVariant = 'interval' | 'hiit' | 'tabata'

export type IntervalAlertMode =
  | 'none'
  | 'beeps3'
  | 'beepsWarning'
  | 'short'
  | 'long'
  | 'alternating'
  | 'bell'
  | 'chime'
  | 'soft'

export type IntervalConfig = {
  name: string
  workSeconds: number
  restSeconds: number
  rounds: number
  warmupSeconds: number
  cooldownSeconds: number
  startWithRest: boolean
  alertMode: IntervalAlertMode
}

export type IntervalPreset = Pick<
  IntervalConfig,
  'workSeconds' | 'restSeconds' | 'rounds'
> & { key: string }

export type IntervalStage = {
  kind: 'warmup' | 'work' | 'rest' | 'cooldown'
  durationMs: number
  round: number
}
