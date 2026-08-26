'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** 每 tick 毫秒刷新一次的当前时间戳 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}

/** 全屏控制，绑定到指定容器 */
export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else if (ref.current) {
        await ref.current.requestFullscreen()
      }
    } catch (error) {
      console.log('[v0] fullscreen error:', error)
    }
  }, [])

  return { ref, isFullscreen, toggle }
}

/** 屏幕常亮（Screen Wake Lock API） */
export function useWakeLock() {
  const [enabled, setEnabled] = useState(false)
  const [supported, setSupported] = useState(false)
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    setSupported('wakeLock' in navigator)
  }, [])

  const release = useCallback(async () => {
    try {
      await lockRef.current?.release()
    } catch (error) {
      console.log('[v0] wakeLock release error:', error)
    }
    lockRef.current = null
    setEnabled(false)
  }, [])

  const request = useCallback(async () => {
    try {
      const sentinel = await navigator.wakeLock.request('screen')
      lockRef.current = sentinel
      sentinel.addEventListener('release', () => setEnabled(false))
      setEnabled(true)
    } catch (error) {
      console.log('[v0] wakeLock request error:', error)
      setEnabled(false)
    }
  }, [])

  const toggle = useCallback(() => {
    if (lockRef.current) void release()
    else void request()
  }, [release, request])

  useEffect(() => {
    return () => {
      void lockRef.current?.release()
    }
  }, [])

  return { enabled, supported, toggle }
}

/** requestAnimationFrame 驱动的高精度计时循环 */
export function useRafLoop(active: boolean, onFrame: () => void) {
  const cbRef = useRef(onFrame)
  cbRef.current = onFrame

  useEffect(() => {
    if (!active) return
    let id = 0
    const loop = () => {
      cbRef.current()
      id = window.requestAnimationFrame(loop)
    }
    id = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(id)
  }, [active])
}

/** 教室提示音色：语义名与设计规范一致（Bell / Chime / Soft Tone） */
export type AlarmSoundId = 'bell' | 'chime' | 'soft'

export const ALARM_SOUNDS: readonly AlarmSoundId[] = ['bell', 'chime', 'soft']

/** 三种音色刻意拉开：铃声（短促双响）、钟琴（上行琶音）、柔和（低频长音） */
function playAlarmTone(ctx: AudioContext, sound: AlarmSoundId) {
  const now = ctx.currentTime

  if (sound === 'bell') {
    // 课堂铃声：两声干脆的高频“叮叮”
    ;[0, 0.22].forEach((offset) => {
      const start = now + offset
      const osc = ctx.createOscillator()
      const overtone = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      overtone.type = 'sine'
      osc.frequency.setValueAtTime(1046, start)
      overtone.frequency.setValueAtTime(1568, start)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.16, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18)
      osc.connect(gain)
      overtone.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      overtone.start(start)
      osc.stop(start + 0.2)
      overtone.stop(start + 0.2)
    })
    return
  }

  if (sound === 'chime') {
    // 钟琴：明亮上行三音，三角波 + 余韵
    ;[523.25, 659.25, 783.99].forEach((freq, index) => {
      const start = now + index * 0.16
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.22, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.58)
    })
    return
  }

  // 柔和：单次低频暖音，缓慢起落
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(220, now)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(480, now)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.2, now + 0.18)
  gain.gain.linearRampToValueAtTime(0.12, now + 0.55)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1)
  osc.connect(filter).connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 1.15)
}

function ensureAudioContext(ctxRef: { current: AudioContext | null }) {
  if (!ctxRef.current || ctxRef.current.state === 'closed') {
    ctxRef.current = new AudioContext()
  }
  const ctx = ctxRef.current
  void ctx.resume()
  return ctx
}

/** 在用户手势中播放一个不可闻的脉冲，兼容需要实际启动音源才能解锁的移动浏览器。 */
function unlockAudioContext(ctxRef: { current: AudioContext | null }) {
  const ctx = ensureAudioContext(ctxRef)
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
  gain.gain.setValueAtTime(0, ctx.currentTime)
  source.connect(gain).connect(ctx.destination)
  source.start()
  return ctx
}

/** 提示音：Web Audio 生成，无需音频文件。开始时可先解锁，避免结束时被浏览器拦截。 */
export function useAlarmSound() {
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    return () => {
      const ctx = ctxRef.current
      if (ctx && ctx.state !== 'closed') void ctx.close()
    }
  }, [])

  const unlock = useCallback(() => {
    try {
      unlockAudioContext(ctxRef)
    } catch (error) {
      console.log('[v0] alarm audio unlock error:', error)
    }
  }, [])

  const play = useCallback((timesOrSound: number | AlarmSoundId = 3) => {
    try {
      const ctx = ensureAudioContext(ctxRef)

      const playWhenReady = () => {
        if (ctx.state === 'closed') return
        if (typeof timesOrSound === 'string') {
          playAlarmTone(ctx, timesOrSound)
          return
        }

        const times = timesOrSound
        for (let i = 0; i < times; i++) {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          const start = ctx.currentTime + i * 0.45
          osc.type = 'sine'
          osc.frequency.setValueAtTime(880, start)
          gain.gain.setValueAtTime(0, start)
          gain.gain.linearRampToValueAtTime(0.28, start + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32)
          osc.connect(gain).connect(ctx.destination)
          osc.start(start)
          osc.stop(start + 0.34)
        }
      }

      if (ctx.state === 'running') playWhenReady()
      else void ctx.resume().then(playWhenReady).catch((error) => console.log('[v0] beep resume error:', error))
    } catch (error) {
      console.log('[v0] beep error:', error)
    }
  }, [])

  return { unlock, play }
}

/** 兼容现有计时工具的简洁提示音调用方式。 */
export function useBeep() {
  return useAlarmSound().play
}

/** 炸弹计时器结束音：短噪声冲击配合低频下坠，不依赖外部音频文件。 */
export function useExplosionSound() {
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    return () => {
      const ctx = ctxRef.current
      if (ctx && ctx.state !== 'closed') void ctx.close()
    }
  }, [])

  const unlock = useCallback(() => {
    try {
      unlockAudioContext(ctxRef)
    } catch (error) {
      console.log('[v0] explosion audio unlock error:', error)
    }
  }, [])

  const play = useCallback(() => {
    try {
      const ctx = ensureAudioContext(ctxRef)

      const playWhenReady = () => {
        if (ctx.state === 'closed') return
        const start = ctx.currentTime + 0.01
        const duration = 0.95
        const compressor = ctx.createDynamicsCompressor()
        compressor.threshold.setValueAtTime(-20, start)
        compressor.knee.setValueAtTime(16, start)
        compressor.ratio.setValueAtTime(6, start)
        compressor.attack.setValueAtTime(0.002, start)
        compressor.release.setValueAtTime(0.24, start)
        compressor.connect(ctx.destination)

        const noiseBuffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate)
        const channel = noiseBuffer.getChannelData(0)
        for (let index = 0; index < channel.length; index += 1) {
          const decay = Math.pow(1 - index / channel.length, 2.25)
          channel[index] = (Math.random() * 2 - 1) * decay
        }

        const noise = ctx.createBufferSource()
        const noiseFilter = ctx.createBiquadFilter()
        const noiseGain = ctx.createGain()
        noise.buffer = noiseBuffer
        noiseFilter.type = 'lowpass'
        noiseFilter.frequency.setValueAtTime(2800, start)
        noiseFilter.frequency.exponentialRampToValueAtTime(180, start + duration)
        noiseGain.gain.setValueAtTime(0.0001, start)
        noiseGain.gain.exponentialRampToValueAtTime(0.38, start + 0.012)
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
        noise.connect(noiseFilter).connect(noiseGain).connect(compressor)

        const impact = ctx.createOscillator()
        const impactGain = ctx.createGain()
        impact.type = 'sawtooth'
        impact.frequency.setValueAtTime(170, start)
        impact.frequency.exponentialRampToValueAtTime(58, start + 0.3)
        impactGain.gain.setValueAtTime(0.0001, start)
        impactGain.gain.exponentialRampToValueAtTime(0.2, start + 0.006)
        impactGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32)
        impact.connect(impactGain).connect(compressor)

        const thump = ctx.createOscillator()
        const thumpGain = ctx.createGain()
        thump.type = 'sine'
        thump.frequency.setValueAtTime(110, start)
        thump.frequency.exponentialRampToValueAtTime(42, start + 0.62)
        thumpGain.gain.setValueAtTime(0.0001, start)
        thumpGain.gain.exponentialRampToValueAtTime(0.34, start + 0.008)
        thumpGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.68)
        thump.connect(thumpGain).connect(compressor)

        noise.start(start)
        noise.stop(start + duration)
        impact.start(start)
        impact.stop(start + 0.34)
        thump.start(start)
        thump.stop(start + 0.7)
      }

      if (ctx.state === 'running') playWhenReady()
      else void ctx.resume().then(playWhenReady).catch((error) => console.log('[v0] explosion sound resume error:', error))
    } catch (error) {
      console.log('[v0] explosion sound error:', error)
    }
  }, [])

  return { unlock, play }
}

/** 最后 10 秒轻提示：高低交替的滴答声 */
export function useTick() {
  const ctxRef = useRef<AudioContext | null>(null)

  return useCallback((odd = false) => {
    try {
      const ctx = ensureAudioContext(ctxRef)
      const start = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(odd ? 720 : 980, start)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.12, start + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.07)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.08)
    } catch (error) {
      console.log('[v0] tick error:', error)
    }
  }, [])
}
