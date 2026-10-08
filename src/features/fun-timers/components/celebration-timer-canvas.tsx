'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createCelebrationScene, type CelebrationKind, type CelebrationModel, type CelebrationViewport } from '../lib/celebration-scene'

export function CelebrationTimerCanvas({ kind, className, artworkRef, groundRef, hideArtwork, ...model }: CelebrationModel & {
  kind: CelebrationKind
  className?: string
  artworkRef: RefObject<HTMLDivElement | null>
  groundRef: RefObject<HTMLDivElement | null>
  hideArtwork: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modelRef = useRef(model)
  const sceneRef = useRef<ReturnType<typeof createCelebrationScene> | null>(null)
  const viewportRef = useRef<CelebrationViewport | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  modelRef.current = model

  const render = useCallback((dt = 0) => {
    if (!canvasRef.current || !sceneRef.current || !viewportRef.current) return false
    return sceneRef.current.draw(canvasRef.current, modelRef.current, viewportRef.current, dt, reducedMotion)
  }, [reducedMotion])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update(); media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    sceneRef.current = createCelebrationScene(kind)
    render()
    return () => { sceneRef.current = null }
  }, [kind]) // The scene must survive timer ticks and motion-preference changes.

  useLayoutEffect(() => {
    // Running frames already read the latest model through the RAF loop.
    if (reducedMotion || model.status !== 'running') render()
  }, [render, reducedMotion, model.status, model.remainingRatio])
  useLayoutEffect(() => {
    if (!canvasRef.current) return
    const measure = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const anchor = hideArtwork ? null : artworkRef.current?.getBoundingClientRect()
      const ground = groundRef.current?.getBoundingClientRect()
      viewportRef.current = {
        width: rect.width,
        height: rect.height,
        groundY: ground?.height ? ground.top - rect.top : rect.height * 0.9,
        artwork: anchor ? { x: anchor.left - rect.left, y: anchor.top - rect.top, size: anchor.width } : undefined,
      }
      canvas.dataset.groundY = String(viewportRef.current.groundY)
      render()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(canvasRef.current)
    if (artworkRef.current) observer.observe(artworkRef.current)
    if (groundRef.current) observer.observe(groundRef.current)
    return () => observer.disconnect()
  }, [render, artworkRef, groundRef, hideArtwork])

  useEffect(() => {
    if (reducedMotion || (model.status !== 'running' && model.status !== 'finished')) return
    let frame = 0
    let previous = performance.now()
    const animate = (now: number) => {
      const dt = Math.min(50, now - previous)
      previous = now
      if (render(dt)) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [model.status, reducedMotion, render, kind])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" data-animation={kind} data-status={model.status} data-progress={(1 - model.remainingRatio).toFixed(5)} />
}
