'use client'

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

type BombTimerCanvasProps = {
  remainingMs?: number
  status: 'ready' | 'running' | 'paused' | 'finished'
  urgent: boolean
  finishLabel: string
  className?: string
}

type Point = { x: number; y: number }

const ARTBOARD = 420
const fuseStart = { x: 194, y: 143 }
const fuseControl = { x: 244, y: 37 }
const fuseEnd = { x: 352, y: 72 }

function getFuseRatio(status: BombTimerCanvasProps['status'], remainingMs?: number) {
  return status === 'ready' || remainingMs === undefined
    ? 1
    : Math.min(1, Math.max(0, remainingMs / 10_000))
}

function mixPoint(from: Point, to: Point, progress: number): Point {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  }
}

function fusePoint(progress: number): Point {
  const first = mixPoint(fuseStart, fuseControl, progress)
  const second = mixPoint(fuseControl, fuseEnd, progress)
  return mixPoint(first, second, progress)
}

function fuseTangent(progress: number): Point {
  return {
    x:
      2 * (1 - progress) * (fuseControl.x - fuseStart.x) +
      2 * progress * (fuseEnd.x - fuseControl.x),
    y:
      2 * (1 - progress) * (fuseControl.y - fuseStart.y) +
      2 * progress * (fuseEnd.y - fuseControl.y),
  }
}

function traceFuse(ctx: CanvasRenderingContext2D, progress: number) {
  const first = mixPoint(fuseStart, fuseControl, progress)
  const second = mixPoint(fuseControl, fuseEnd, progress)
  const endpoint = mixPoint(first, second, progress)
  ctx.beginPath()
  ctx.moveTo(fuseStart.x, fuseStart.y)
  ctx.quadraticCurveTo(first.x, first.y, endpoint.x, endpoint.y)
}

function drawBombBody(ctx: CanvasRenderingContext2D, urgent: boolean) {
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,.5)'
  ctx.beginPath()
  ctx.ellipse(169, 380, 115, 21, 0, 0, Math.PI * 2)
  ctx.fill()

  const shell = ctx.createRadialGradient(106, 205, 12, 171, 278, 170)
  shell.addColorStop(0, '#73747a')
  shell.addColorStop(0.28, '#55565d')
  shell.addColorStop(0.7, '#34353b')
  shell.addColorStop(1, '#14151a')
  ctx.fillStyle = shell
  ctx.strokeStyle = urgent ? '#ff453a' : '#686970'
  ctx.lineWidth = urgent ? 4 : 3
  ctx.beginPath()
  ctx.arc(166, 278, 129, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  const lowerShade = ctx.createLinearGradient(64, 280, 264, 382)
  lowerShade.addColorStop(0, 'rgba(18,19,23,.05)')
  lowerShade.addColorStop(1, 'rgba(5,6,8,.72)')
  ctx.fillStyle = lowerShade
  ctx.beginPath()
  ctx.arc(166, 278, 124, 0.1, Math.PI - 0.15, false)
  ctx.arc(166, 278, 124, Math.PI - 0.15, 0.1, true)
  ctx.fill()

  ctx.save()
  ctx.translate(104, 220)
  ctx.rotate(Math.PI / 4)
  const shine = ctx.createLinearGradient(-18, -45, 20, 44)
  shine.addColorStop(0, 'rgba(255,255,255,.95)')
  shine.addColorStop(1, 'rgba(224,225,229,.55)')
  ctx.fillStyle = shine
  ctx.beginPath()
  ctx.ellipse(0, 0, 20, 47, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = 'rgba(139,140,147,.28)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(166, 278, 119, 0.42, Math.PI - 0.18)
  ctx.stroke()
  ctx.restore()
}

function drawFuse(ctx: CanvasRenderingContext2D, progress: number) {
  if (progress <= 0) return

  const rope = ctx.createLinearGradient(fuseStart.x, fuseStart.y, fuseEnd.x, fuseEnd.y)
  rope.addColorStop(0, '#24252a')
  rope.addColorStop(0.5, '#111216')
  rope.addColorStop(1, '#403b3d')

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  traceFuse(ctx, progress)
  ctx.strokeStyle = '#090a0d'
  ctx.lineWidth = 34
  ctx.stroke()
  traceFuse(ctx, progress)
  ctx.strokeStyle = rope
  ctx.lineWidth = 29
  ctx.stroke()
  traceFuse(ctx, progress)
  ctx.strokeStyle = 'rgba(126,127,134,.34)'
  ctx.lineWidth = 7
  ctx.stroke()

  const ridgeStep = 0.055
  for (let ridge = ridgeStep; ridge < progress - 0.018; ridge += ridgeStep) {
    const point = fusePoint(ridge)
    const tangent = fuseTangent(ridge)
    const length = Math.hypot(tangent.x, tangent.y) || 1
    const normal = { x: -tangent.y / length, y: tangent.x / length }
    const halfWidth = 13
    ctx.beginPath()
    ctx.moveTo(point.x - normal.x * halfWidth, point.y - normal.y * halfWidth)
    ctx.lineTo(point.x + normal.x * halfWidth, point.y + normal.y * halfWidth)
    ctx.strokeStyle = 'rgba(3,4,6,.52)'
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(point.x - normal.x * 8 - 2, point.y - normal.y * 8 - 2)
    ctx.lineTo(point.x + normal.x * 8 - 2, point.y + normal.y * 8 - 2)
    ctx.strokeStyle = 'rgba(111,112,119,.24)'
    ctx.lineWidth = 2
    ctx.stroke()
  }
  ctx.restore()
}

function drawBombCap(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.translate(190, 154)
  ctx.rotate(0.08)

  const cap = ctx.createLinearGradient(-55, -42, 52, 49)
  cap.addColorStop(0, '#696a70')
  cap.addColorStop(0.42, '#45464c')
  cap.addColorStop(1, '#1f2025')
  ctx.fillStyle = cap
  ctx.strokeStyle = '#6f7077'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(-55, -35)
  ctx.bezierCurveTo(-43, -51, 43, -49, 55, -31)
  ctx.lineTo(59, 19)
  ctx.bezierCurveTo(60, 33, 47, 41, 32, 41)
  ctx.lineTo(-36, 41)
  ctx.bezierCurveTo(-51, 41, -63, 31, -61, 17)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#5f6066'
  ctx.strokeStyle = '#85868d'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(0, -34, 55, 19, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#17181d'
  ctx.strokeStyle = '#303137'
  ctx.beginPath()
  ctx.ellipse(1, -33, 29, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = '#ff9f0a'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-57, 23)
  ctx.bezierCurveTo(-28, 37, 29, 40, 56, 28)
  ctx.stroke()
  ctx.restore()
}

function drawSpark(ctx: CanvasRenderingContext2D, position: Point, phase: number, reducedMotion: boolean) {
  const pulse = reducedMotion ? 1 : 0.88 + Math.sin(phase * 0.018) * 0.12
  ctx.save()
  ctx.translate(position.x, position.y)
  ctx.scale(pulse, pulse)
  ctx.rotate(reducedMotion ? 0 : phase * 0.0012)

  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 25)
  glow.addColorStop(0, 'rgba(255,214,10,.95)')
  glow.addColorStop(0.35, 'rgba(255,159,10,.82)')
  glow.addColorStop(1, 'rgba(255,159,10,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(0, 0, 25, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#ff9f0a'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  for (let ray = 0; ray < 8; ray += 1) {
    const angle = (Math.PI * 2 * ray) / 8
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * 18, Math.sin(angle) * 18)
    ctx.lineTo(Math.cos(angle) * 31, Math.sin(angle) * 31)
    ctx.stroke()
  }

  ctx.fillStyle = '#ff9f0a'
  ctx.beginPath()
  ctx.arc(0, 0, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffd60a'
  ctx.beginPath()
  ctx.arc(0, 0, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function traceBurst(ctx: CanvasRenderingContext2D, radius: number, points: number) {
  ctx.beginPath()
  for (let index = 0; index < points * 2; index += 1) {
    const angle = -Math.PI / 2 + (Math.PI * index) / points
    const currentRadius = index % 2 === 0 ? radius : radius * 0.56
    const x = 210 + Math.cos(angle) * currentRadius
    const y = 210 + Math.sin(angle) * currentRadius
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function drawExplosion(ctx: CanvasRenderingContext2D, progress: number, finishLabel: string, reducedMotion: boolean) {
  const eased = 1 - Math.pow(1 - progress, 3)
  const expansion = reducedMotion ? 1 : 0.35 + eased * 0.65
  const debris = [
    [-142, -96], [137, -112], [-151, 92], [151, 106], [-78, -154], [81, -159], [-76, 158], [88, 151],
  ]

  ctx.save()
  ctx.globalAlpha = Math.min(1, progress * 3)
  ctx.strokeStyle = `rgba(255,69,58,${Math.max(0, 1 - progress)})`
  ctx.lineWidth = 12
  ctx.beginPath()
  ctx.arc(210, 210, 78 + eased * 96, 0, Math.PI * 2)
  ctx.stroke()

  debris.forEach(([offsetX, offsetY], index) => {
    const travel = reducedMotion ? 0.82 : 0.35 + eased * 0.65
    ctx.save()
    ctx.translate(210 + offsetX * travel, 210 + offsetY * travel)
    ctx.rotate(index * 0.68)
    ctx.fillStyle = index % 2 ? '#ff9f0a' : '#ff453a'
    ctx.fillRect(-13, -5, 26, 10)
    ctx.restore()
  })

  ctx.translate(210, 210)
  ctx.scale(expansion, expansion)
  ctx.translate(-210, -210)
  traceBurst(ctx, 150, 12)
  ctx.fillStyle = '#ff9f0a'
  ctx.fill()
  traceBurst(ctx, 112, 11)
  ctx.fillStyle = '#ffd60a'
  ctx.fill()
  ctx.fillStyle = '#f5f5f7'
  ctx.beginPath()
  ctx.arc(210, 210, 62, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#17110a'
  ctx.font = '800 34px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(finishLabel, 210, 212, 112)
  ctx.restore()
}

function drawScene(
  canvas: HTMLCanvasElement,
  model: Omit<BombTimerCanvasProps, 'className'>,
  explosionProgress: number,
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
  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (model.status === 'finished') {
    drawExplosion(ctx, explosionProgress, model.finishLabel, reducedMotion)
  } else {
    const fuseRatio = getFuseRatio(model.status, model.remainingMs)
    drawBombBody(ctx, model.urgent)
    drawFuse(ctx, fuseRatio)
    drawBombCap(ctx)
    if ((model.status === 'running' || model.status === 'paused') && fuseRatio > 0) {
      drawSpark(ctx, fusePoint(fuseRatio), performance.now(), reducedMotion || model.status === 'paused')
    }
  }
  ctx.restore()
}

export function BombTimerCanvas({
  remainingMs,
  status,
  urgent,
  finishLabel,
  className,
}: BombTimerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modelRef = useRef({ remainingMs, status, urgent, finishLabel })
  const explosionProgressRef = useRef(status === 'finished' ? 1 : 0)
  modelRef.current = { remainingMs, status, urgent, finishLabel }

  const render = useCallback(() => {
    if (!canvasRef.current) return
    drawScene(canvasRef.current, modelRef.current, explosionProgressRef.current)
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
    if (status !== 'finished') {
      explosionProgressRef.current = 0
      render()
      return
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      explosionProgressRef.current = 1
      render()
      return
    }

    const startedAt = performance.now()
    let frame = 0
    const animate = (now: number) => {
      explosionProgressRef.current = Math.min(1, (now - startedAt) / 720)
      render()
      if (explosionProgressRef.current < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [render, status])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      data-fuse-ratio={getFuseRatio(status, remainingMs).toFixed(4)}
      aria-hidden="true"
    />
  )
}
