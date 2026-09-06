'use client'

import { useEffect, useRef } from 'react'
import type { AnimationItem } from 'lottie-web'
import styles from './pomodoro-timer.module.css'

type AnimationShape = { nm?: string; cl?: string }
type BoatAnimation = {
  layers: { nm?: string; shapes?: AnimationShape[] }[]
  markers: { cm: string; tm: number; dr: number }[]
}
type Props = {
  status: 'ready' | 'running' | 'paused' | 'finished'
  active: boolean
  completedFocus: number
}

export function FishingAnimation({ status, active, completedFocus }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef({ status, active, completedFocus })
  const syncRef = useRef<() => void>(() => {})
  stateRef.current = { status, active, completedFocus }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const controller = new AbortController()
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let disposed = false
    let animation: AnimationItem | undefined
    let segments: Record<'fishing' | 'catch', [number, number]>
    let currentSegment: 'fishing' | 'catch' | undefined
    let lastCompleted = stateRef.current.completedFocus

    const selectSegment = (name: 'fishing' | 'catch') => {
      if (!animation) return
      currentSegment = name
      animation.loop = name === 'fishing'
      animation.playSegments(segments[name], true)
    }
    const sync = () => {
      if (!animation) return
      const state = stateRef.current
      const earnedFish = state.completedFocus > lastCompleted
      const restarted = state.completedFocus < lastCompleted
      lastCompleted = state.completedFocus
      if (!state.active || state.status === 'ready' || restarted) {
        if (currentSegment !== 'fishing') selectSegment('fishing')
        animation.goToAndStop(0, true)
        if (!state.active || state.status === 'ready') return
      }
      // The same completed-focus count drives the tab badge and this reward.
      // Catching up after a hidden tab shows one catch, never a queued burst.
      if (earnedFish) selectSegment('catch')
      else if (!currentSegment) selectSegment('fishing')
      if (motion.matches) {
        // A visible fish replaces the reeling motion for reduced-motion users.
        animation.goToAndStop(currentSegment === 'catch' ? 42 : 0, true)
      } else if (document.hidden || (state.status !== 'running' && !(currentSegment === 'catch' && state.status === 'finished'))) {
        animation.pause()
      } else animation.play()
    }
    const finishCatch = () => {
      if (currentSegment !== 'catch') return
      selectSegment('fishing')
      sync()
    }
    syncRef.current = sync
    motion.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)

    void Promise.all([
      import('lottie-web'),
      fetch('/animations/cat-boat.json', { signal: controller.signal }).then(response => {
        if (!response.ok) throw new Error('Animation unavailable')
        return response.json() as Promise<BoatAnimation>
      }),
    ]).then(([{ default: lottie }, data]) => {
      if (disposed) return
      const segment = (name: string): [number, number] => {
        const marker = data.markers.find(item => item.cm === name)
        if (!marker) throw new Error('Animation segment unavailable')
        return [marker.tm, marker.tm + marker.dr]
      }
      segments = { fishing: segment('fishing'), catch: segment('catch') }
      const gear = data.layers.find(layer => layer.nm === 'fishing slip')
      for (const group of gear?.shapes ?? []) {
        if (['chip fita', 'Group 10', 'Group 11', 'Chip Hand'].includes(group.nm ?? '')) {
          group.cl = 'pomodoro-fishing-gear'
        }
      }
      animation = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        animationData: data,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
      })
      animation.addEventListener('DOMLoaded', sync)
      animation.addEventListener('complete', finishCatch)
      animation.addEventListener('data_failed', () => { animation?.destroy() })
    }).catch(() => {
      // Decorative media may fail without blocking the timer or its controls.
    })

    return () => {
      disposed = true
      controller.abort()
      motion.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
      animation?.destroy()
      syncRef.current = () => {}
    }
  }, [])

  useEffect(() => { syncRef.current() }, [status, active, completedFocus])

  return <div ref={containerRef} className={styles.animation} aria-hidden="true" />
}
