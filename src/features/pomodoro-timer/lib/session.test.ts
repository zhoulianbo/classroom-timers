import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildStages, reconcileStages } from '../../interval-timer/lib/stages'
import { buildPomodoroStages, DEFAULT_TIMING, isRoundPassed, jumpSession, newSession, reconcileSession } from './session'

const stages = buildPomodoroStages(DEFAULT_TIMING)
const startAt = 1_000_000
const running = () => ({ ...newSession(stages), status: 'running' as const, endAt: startAt + stages[0].durationMs })

test('default set has four focus phases, three short breaks and one long break', () => {
  assert.equal(stages.length, 8)
  assert.deepEqual(stages.map(stage => stage.durationMs / 60_000), [25, 5, 25, 5, 25, 5, 25, 15])
  assert.equal(stages[7].longBreak, true)
  const regular = buildPomodoroStages({ focus: 50, break: 10, sessions: 1, longBreak: 0 })
  assert.deepEqual(regular.map(stage => stage.durationMs / 60_000), [50, 10])
})

test('exact phase boundary increments focus and begins the break without drift', () => {
  const next = reconcileSession(running(), stages, startAt + 25 * 60_000)
  assert.equal(next.index, 1)
  assert.equal(next.remainingMs, 5 * 60_000)
  assert.deepEqual(next.completed, [0])
  assert.equal(next.endAt, startAt + 30 * 60_000)
})

test('a hidden tab catches up multiple phases and counts each just once', () => {
  const next = reconcileSession(running(), stages, startAt + 61 * 60_000)
  assert.equal(next.index, 4)
  assert.equal(next.remainingMs, 24 * 60_000)
  assert.deepEqual(next.completed, [0, 1, 2, 3])
  assert.deepEqual(reconcileSession(next, stages, startAt + 61 * 60_000).completed, next.completed)
})

test('pause preserves exact milliseconds and resume preserves the remaining ratio', () => {
  const next = reconcileSession(running(), stages, startAt + 1234)
  const paused = { ...next, status: 'paused' as const, endAt: 0 }
  assert.equal(reconcileSession(paused, stages, startAt + 100_000), paused)
  const resumedAt = startAt + 100_000
  const resumed = { ...paused, status: 'running' as const, endAt: resumedAt + paused.remainingMs }
  assert.equal(reconcileSession(resumed, stages, resumedAt).remainingMs, paused.remainingMs)
  assert.equal(reconcileSession(resumed, stages, resumedAt + 500).remainingMs, paused.remainingMs - 500)
})

test('skip does not count as completion; the following natural finish does', () => {
  const skipped = jumpSession(running(), stages, 1, startAt + 1000)
  assert.deepEqual(skipped.completed, [])
  const next = reconcileSession(skipped, stages, skipped.endAt)
  assert.deepEqual(next.completed, [1])
  assert.equal(next.index, 2)
  const readySkip = jumpSession(newSession(stages), stages, 1, startAt)
  assert.equal(readySkip.status, 'paused')
  assert.equal(readySkip.endAt, 0)
})

test('round dots treat skipped rounds as passed once the session leaves them', () => {
  const stillInRound = jumpSession(running(), stages, 1, startAt + 1000)
  assert.equal(isRoundPassed(stillInRound, 0), false)
  const leftRound = jumpSession(stillInRound, stages, 2, startAt + 2000)
  assert.equal(isRoundPassed(leftRound, 0), true)
  assert.equal(isRoundPassed(leftRound, 1), false)
  const finished = jumpSession(leftRound, stages, stages.length, startAt + 3000)
  assert.equal(isRoundPassed(finished, 0), true)
  assert.equal(isRoundPassed(finished, 3), true)
})

test('complete set stops at zero and reset clears all counts', () => {
  const finished = reconcileSession(running(), stages, startAt + 130 * 60_000)
  assert.equal(finished.status, 'finished')
  assert.equal(finished.remainingMs, 0)
  assert.equal(finished.completed.length, 8)
  assert.equal(reconcileSession(finished, stages, startAt + 200 * 60_000), finished)
  assert.deepEqual(newSession(stages).completed, [])
  assert.equal(newSession(stages).remainingMs, 25 * 60_000)
})

test('shared Interval stage construction preserves warmup, final-rest and cooldown behavior', () => {
  const config = { name: '', workSeconds: 10, restSeconds: 2, rounds: 2, warmupSeconds: 3, cooldownSeconds: 4, startWithRest: false, alertMode: 'none' as const }
  assert.deepEqual(buildStages(config, false).map(stage => stage.kind), ['warmup', 'work', 'rest', 'work', 'cooldown'])
  const sequence = buildStages(config, true)
  assert.deepEqual(sequence.map(stage => stage.kind), ['warmup', 'work', 'rest', 'work', 'rest', 'cooldown'])
  assert.equal(reconcileStages(sequence, 0, 3000, 16000).index, 3)
  assert.deepEqual(buildStages({ ...config, startWithRest: true }, false).map(stage => stage.kind), ['warmup', 'rest', 'work', 'rest', 'work', 'cooldown'])
})
