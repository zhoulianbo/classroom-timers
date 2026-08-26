'use client'

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

type CountdownStatus = 'ready' | 'running' | 'paused' | 'finished'

type SandTimerCanvasProps = {
  remainingRatio: number
  status: CountdownStatus
  className?: string
}

const ARTBOARD = 420
const CENTER_X = 210
const GLASS_TOP = 78
const GLASS_BOTTOM = 342
const WAIST_Y = 210

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function pseudoRandom(seed: number) {
  return Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1
}

function traceGlassInterior(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.moveTo(119, GLASS_TOP)
  ctx.lineTo(301, GLASS_TOP)
  ctx.bezierCurveTo(300, 138, 270, 169, 226, WAIST_Y)
  ctx.bezierCurveTo(270, 251, 300, 282, 301, GLASS_BOTTOM)
  ctx.lineTo(119, GLASS_BOTTOM)
  ctx.bezierCurveTo(120, 282, 150, 251, 194, WAIST_Y)
  ctx.bezierCurveTo(150, 169, 120, 138, 119, GLASS_TOP)
  ctx.closePath()
}

function chamberHalfWidth(y: number, chamber: 'upper' | 'lower') {
  const distanceFromWaist = chamber === 'upper'
    ? clamp01((WAIST_Y - y) / (WAIST_Y - GLASS_TOP))
    : clamp01((y - WAIST_Y) / (GLASS_BOTTOM - WAIST_Y))
  return 12 + Math.pow(distanceFromWaist, 0.74) * 77
}

function drawGlassShadow(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, .62)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 15
  ctx.fillStyle = 'rgba(7, 7, 9, .48)'
  traceGlassInterior(ctx)
  ctx.fill()
  ctx.restore()
}

function drawGlassBody(ctx: CanvasRenderingContext2D) {
  const glass = ctx.createLinearGradient(115, 0, 305, 0)
  glass.addColorStop(0, 'rgba(160, 176, 190, .14)')
  glass.addColorStop(0.2, 'rgba(73, 82, 92, .05)')
  glass.addColorStop(0.63, 'rgba(214, 228, 238, .09)')
  glass.addColorStop(1, 'rgba(86, 96, 108, .18)')
  ctx.fillStyle = glass
  ctx.strokeStyle = 'rgba(180, 187, 197, .78)'
  ctx.lineWidth = 4
  traceGlassInterior(ctx)
  ctx.fill()
  ctx.stroke()
}

function drawUpperSand(ctx: CanvasRenderingContext2D, ratio: number) {
  if (ratio <= 0) return

  const surfaceY = 199 - Math.pow(ratio, 0.72) * 108
  const surfaceHalfWidth = chamberHalfWidth(surfaceY, 'upper') - 3
  const sand = ctx.createLinearGradient(0, surfaceY, 0, WAIST_Y)
  sand.addColorStop(0, '#ffd66f')
  sand.addColorStop(0.55, '#eeb44a')
  sand.addColorStop(1, '#b86d1b')

  ctx.fillStyle = sand
  ctx.beginPath()
  ctx.moveTo(CENTER_X - surfaceHalfWidth, surfaceY + 1)
  ctx.quadraticCurveTo(CENTER_X, surfaceY - 4, CENTER_X + surfaceHalfWidth, surfaceY + 1)
  ctx.lineTo(CENTER_X + 14, WAIST_Y + 1)
  ctx.lineTo(CENTER_X - 14, WAIST_Y + 1)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 231, 151, .82)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(CENTER_X - surfaceHalfWidth + 2, surfaceY)
  ctx.quadraticCurveTo(CENTER_X, surfaceY - 4, CENTER_X + surfaceHalfWidth - 2, surfaceY)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255, 237, 177, .58)'
  const speckCount = Math.round(42 * ratio)
  for (let index = 0; index < speckCount; index += 1) {
    const y = surfaceY + 7 + pseudoRandom(index + 4) * Math.max(1, WAIST_Y - surfaceY - 13)
    const halfWidth = chamberHalfWidth(y, 'upper') - 7
    const x = CENTER_X + (pseudoRandom(index + 29) * 2 - 1) * halfWidth
    const radius = 0.8 + pseudoRandom(index + 51) * 1.25
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawLowerSand(ctx: CanvasRenderingContext2D, progress: number) {
  if (progress <= 0) return GLASS_BOTTOM - 4

  const pileTop = GLASS_BOTTOM - 9 - Math.pow(progress, 0.69) * 102
  const baseY = GLASS_BOTTOM + 2
  const sand = ctx.createLinearGradient(0, pileTop, 0, GLASS_BOTTOM)
  sand.addColorStop(0, '#ffda73')
  sand.addColorStop(0.48, '#eeb348')
  sand.addColorStop(1, '#a85d17')

  ctx.fillStyle = sand
  ctx.beginPath()
  ctx.moveTo(CENTER_X, pileTop)
  ctx.bezierCurveTo(CENTER_X - 26, pileTop + 9, 149, pileTop + 34, 121, baseY)
  ctx.lineTo(299, baseY)
  ctx.bezierCurveTo(271, pileTop + 34, CENTER_X + 26, pileTop + 9, CENTER_X, pileTop)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 231, 146, .72)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(CENTER_X - 55 * Math.sqrt(progress), pileTop + 18)
  ctx.quadraticCurveTo(CENTER_X, pileTop - 1, CENTER_X + 55 * Math.sqrt(progress), pileTop + 18)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255, 235, 165, .5)'
  const speckCount = Math.round(58 * progress)
  for (let index = 0; index < speckCount; index += 1) {
    const normalizedY = pseudoRandom(index + 73)
    const y = pileTop + 10 + normalizedY * Math.max(1, GLASS_BOTTOM - pileTop - 16)
    const halfWidth = Math.max(8, chamberHalfWidth(y, 'lower') - 6)
    const x = CENTER_X + (pseudoRandom(index + 101) * 2 - 1) * halfWidth
    const radius = 0.85 + pseudoRandom(index + 133) * 1.35
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  return pileTop
}

function drawSand(
  ctx: CanvasRenderingContext2D,
  ratio: number,
  status: CountdownStatus,
  phase: number,
  reducedMotion: boolean,
) {
  const progress = 1 - ratio
  ctx.save()
  traceGlassInterior(ctx)
  ctx.clip()
  drawUpperSand(ctx, ratio)
  const pileTop = drawLowerSand(ctx, progress)

  if (status === 'running' && ratio > 0) {
    const streamEnd = Math.max(WAIST_Y + 16, pileTop + 2)
    const stream = ctx.createLinearGradient(0, WAIST_Y, 0, streamEnd)
    stream.addColorStop(0, 'rgba(255, 224, 125, .96)')
    stream.addColorStop(1, 'rgba(213, 139, 35, .74)')
    ctx.strokeStyle = stream
    ctx.lineCap = 'round'
    ctx.lineWidth = 2.6
    ctx.beginPath()
    ctx.moveTo(CENTER_X, WAIST_Y - 2)
    ctx.lineTo(CENTER_X, streamEnd)
    ctx.stroke()

    ctx.fillStyle = '#ffd96f'
    for (let index = 0; index < 8; index += 1) {
      const offset = reducedMotion ? index / 8 : (phase * 0.76 + index / 8) % 1
      const y = WAIST_Y + 3 + offset * Math.max(1, streamEnd - WAIST_Y - 4)
      const x = CENTER_X + Math.sin(index * 2.3 + phase * 8) * 1.8
      ctx.beginPath()
      ctx.arc(x, y, 1.1 + (index % 3) * 0.25, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawGlassHighlights(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(244, 249, 252, .34)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.bezierCurveTo(139, 96, 144, 137, 171, 165)
  ctx.stroke()
  ctx.beginPath()
  ctx.bezierCurveTo(143, 282, 137, 310, 139, 327)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255, 255, 255, .11)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.bezierCurveTo(276, 100, 275, 141, 246, 174)
  ctx.stroke()
  ctx.restore()
}

function drawFrame(ctx: CanvasRenderingContext2D) {
  const postGradient = ctx.createLinearGradient(0, 0, 0, ARTBOARD)
  postGradient.addColorStop(0, '#5b5c62')
  postGradient.addColorStop(0.45, '#27282d')
  postGradient.addColorStop(1, '#4a4b51')

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, .48)'
  ctx.shadowBlur = 13
  ctx.shadowOffsetY = 8
  ctx.fillStyle = postGradient
  for (const x of [83, 321]) {
    ctx.beginPath()
    ctx.roundRect(x, 68, 16, 284, 8)
    ctx.fill()
  }
  ctx.restore()

  const beamGradient = ctx.createLinearGradient(0, 48, 0, 86)
  beamGradient.addColorStop(0, '#85868c')
  beamGradient.addColorStop(0.34, '#4f5056')
  beamGradient.addColorStop(1, '#24252a')

  for (const y of [52, 344]) {
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, .52)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = y < 100 ? 7 : 10
    ctx.fillStyle = beamGradient
    ctx.strokeStyle = '#7d7e84'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(66, y, 288, 26, 13)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    ctx.strokeStyle = 'rgba(255, 255, 255, .26)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(80, y + 7)
    ctx.lineTo(340, y + 7)
    ctx.stroke()
  }

  ctx.fillStyle = '#b77825'
  ctx.beginPath()
  ctx.roundRect(103, 75, 214, 6, 3)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(103, 340, 214, 6, 3)
  ctx.fill()
}

function drawScene(
  canvas: HTMLCanvasElement,
  model: Omit<SandTimerCanvasProps, 'className'>,
  phase: number,
) {
  const rect = canvas.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  const bitmapWidth = Math.max(1, Math.round(rect.width * pixelRatio))
  const bitmapHeight = Math.max(1, Math.round(rect.height * pixelRatio))
  if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
    canvas.width = bitmapWidth
    canvas.height = bitmapHeight
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.clearRect(0, 0, rect.width, rect.height)

  const scale = Math.min(rect.width, rect.height) / ARTBOARD
  const offsetX = (rect.width - ARTBOARD * scale) / 2
  const offsetY = (rect.height - ARTBOARD * scale) / 2
  const ratio = clamp01(model.remainingRatio)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)
  drawGlassShadow(ctx)
  drawFrame(ctx)
  drawGlassBody(ctx)
  drawSand(ctx, ratio, model.status, phase, reducedMotion)
  drawGlassHighlights(ctx)
  ctx.restore()
}

export function SandTimerCanvas({
  remainingRatio,
  status,
  className,
}: SandTimerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modelRef = useRef({ remainingRatio, status })
  const phaseRef = useRef(0)
  modelRef.current = { remainingRatio, status }

  const render = useCallback(() => {
    if (!canvasRef.current) return
    drawScene(canvasRef.current, modelRef.current, phaseRef.current)
    canvasRef.current.dataset.remainingRatio = clamp01(modelRef.current.remainingRatio).toFixed(4)
  }, [])

  useLayoutEffect(render)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(render)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [render])

  useEffect(() => {
    if (status !== 'running') {
      render()
      return
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      render()
      return
    }

    let frame = 0
    let previousFrameAt = performance.now()
    const animate = (now: number) => {
      phaseRef.current += Math.min(50, now - previousFrameAt) / 1000
      previousFrameAt = now
      render()
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [render, status])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      data-remaining-ratio={clamp01(remainingRatio).toFixed(4)}
      aria-hidden="true"
    />
  )
}
