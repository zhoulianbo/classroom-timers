import type { IntervalConfig, IntervalStage } from '../types'

export function buildStages(config: IntervalConfig, includeFinalRest: boolean): IntervalStage[] {
  const stages: IntervalStage[] = []
  if (config.warmupSeconds > 0) {
    stages.push({ kind: 'warmup', durationMs: config.warmupSeconds * 1000, round: 1 })
  }
  for (let round = 1; round <= config.rounds; round += 1) {
    const work = { kind: 'work' as const, durationMs: config.workSeconds * 1000, round }
    const rest = { kind: 'rest' as const, durationMs: config.restSeconds * 1000, round }
    if (config.startWithRest) {
      stages.push(rest, work)
    } else {
      stages.push(work)
      if (round < config.rounds || includeFinalRest) stages.push(rest)
    }
  }
  if (config.cooldownSeconds > 0) {
    stages.push({ kind: 'cooldown', durationMs: config.cooldownSeconds * 1000, round: config.rounds })
  }
  return stages
}


/** Carry the original deadline across every elapsed stage, including hidden tabs. */
export function reconcileStages(stages: readonly { durationMs: number }[], index: number, endAt: number, now: number) {
  while (index < stages.length && now >= endAt) {
    index += 1
    if (index < stages.length) endAt += stages[index].durationMs
  }
  return { index, endAt, remainingMs: index < stages.length ? Math.max(0, endAt - now) : 0 }
}
