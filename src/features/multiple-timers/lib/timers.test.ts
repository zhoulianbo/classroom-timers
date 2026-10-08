import assert from 'node:assert/strict'
import { test } from 'node:test'
import { advanceTimer, isTimerConfig, pauseTimer, resetTimer, startTimer, timerValue, type TimerConfig } from './timers'

const config: TimerConfig = {
  id: 'test', name: '', type: 'countdown', durationMs: 5000,
  targetAt: null, sound: 'none', repeat: false, color: 'amber',
}

test('pause freezes the same countdown and progress snapshot; resume loses no time', () => {
  const running = startTimer(resetTimer(config, 1000), 1000)
  const before = timerValue(running, 2234)
  const paused = pauseTimer(running, 2234)
  assert.equal(timerValue(paused, 80_000), before)
  assert.equal(paused.valueMs / paused.sessionMs, before / running.sessionMs)
  const resumed = startTimer(paused, 80_000)
  assert.equal(timerValue(resumed, 80_000), before)
  assert.equal(timerValue(resumed, 80_500), before - 500)
})

test('repeats catch up missed cycles without deadline drift or duplicate completion', () => {
  const running = startTimer(resetTimer({ ...config, repeat: true }, 0), 1000)
  const boundary = advanceTimer(running, 6000)
  assert.equal(boundary.cycles, 1)
  assert.equal(timerValue(boundary, 6000), 5000)
  const late = advanceTimer(boundary, 17_250)
  assert.equal(late.cycles, 3)
  assert.equal(late.anchorAt, 21_000)
  assert.equal(timerValue(late, 17_250), 3750)
  assert.equal(advanceTimer(late, 17_250), late)
})

test('a completed countdown stays at zero until restarted or reset', () => {
  const running = startTimer(resetTimer(config, 0), 1000)
  const done = advanceTimer(running, 80_000)
  assert.equal(done.status, 'finished')
  assert.equal(timerValue(done, 90_000), 0)
  assert.equal(advanceTimer(done, 90_000), done)
  assert.equal(startTimer(done, 90_000).anchorAt, 95_000)
  assert.equal(resetTimer(done, 90_000).status, 'ready')
})

test('stopwatch pause excludes paused time and reset returns to zero', () => {
  const running = startTimer(resetTimer({ ...config, type: 'stopwatch', durationMs: 0 }, 0), 1000)
  const paused = pauseTimer(running, 2234)
  const resumed = startTimer(paused, 10_000)
  assert.equal(timerValue(paused, 9000), 1234)
  assert.equal(timerValue(resumed, 10_500), 1734)
  assert.equal(resetTimer(resumed, 11_000).valueMs, 0)
})

test('date countdown uses the chosen deadline at start, freezes on pause and resets to the original date', () => {
  const ready = resetTimer({ ...config, targetAt: 20_000 }, 1000)
  assert.equal(timerValue(ready, 5000), 15_000)
  const running = startTimer(ready, 5000)
  assert.equal(running.anchorAt, 20_000)
  assert.equal(running.sessionMs, 15_000)
  const resumed = startTimer(pauseTimer(running, 7000), 10_000)
  assert.equal(resumed.anchorAt, 23_000)
  assert.equal(timerValue(resetTimer(resumed, 12_000), 12_000), 8000)
  assert.equal(startTimer(resetTimer(resumed, 30_000), 30_000).status, 'finished')
})

test('batch start leaves running timers intact and synchronizes new timers', () => {
  const running = startTimer(resetTimer(config, 0), 1000)
  const ready = resetTimer({ ...config, id: 'other' }, 0)
  const result = [running, ready].map((timer) => startTimer(timer, 3000))
  assert.equal(result[0], running)
  assert.equal(result[1].anchorAt, 8000)
  assert.equal(pauseTimer(result[1], 4000).status, 'paused')
  assert.equal(result[0].status, 'running')
})

test('stored configurations reject invalid durations, dates, colors and repeat modes', () => {
  assert.equal(isTimerConfig(config), true)
  for (const invalid of [
    { ...config, durationMs: 0 }, { ...config, durationMs: NaN },
    { ...config, color: '__proto__' }, { ...config, targetAt: Infinity },
    { ...config, targetAt: 30_000, repeat: true },
    { ...config, type: 'stopwatch', repeat: true },
  ]) assert.equal(isTimerConfig(invalid), false)
})
