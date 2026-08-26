'use client'

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

type CountdownStatus = 'ready' | 'running' | 'paused' | 'finished'

type CandleTimerCanvasProps = {
  remainingRatio: number
  status: CountdownStatus
  className?: string
}

const ARTBOARD = 420
const CENTER_X = 210
const WAX_BOTTOM = 332
const MAX_WAX_HEIGHT = 224
const MIN_WAX_HEIGHT = 28

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function traceWaxBody(ctx: CanvasRenderingContext2D, topY: number) {
  const left = 132
  const right = 288
  ctx.beginPath()
  ctx.moveTo(left, topY + 10)
  ctx.bezierCurveTo(left + 9, topY + 2, left + 17, topY + 20, left + 29, topY + 17)
  ctx.bezierCurveTo(left + 42, topY + 14, left + 53, topY - 2, left + 68, topY + 6)
  ctx.bezierCurveTo(left + 83, topY + 14, left + 94, topY + 19, left + 108, topY + 10)
  ctx.bezierCurveTo(left + 126, topY - 2, right - 8, topY + 1, right, topY + 9)
  ctx.lineTo(right, WAX_BOTTOM - 18)
  ctx.quadraticCurveTo(right, WAX_BOTTOM, right - 18, WAX_BOTTOM)
  ctx.lineTo(left + 18, WAX_BOTTOM)
  ctx.quadraticCurveTo(left, WAX_BOTTOM, left, WAX_BOTTOM - 18)
  ctx.closePath()
}

function drawHolderBack(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, .58)'
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = 14
  ctx.fillStyle = 'rgba(0, 0, 0, .46)'
  ctx.beginPath()
  ctx.ellipse(CENTER_X, 364, 133, 28, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const dish = ctx.createLinearGradient(0, 320, 0, 386)
  dish.addColorStop(0, '#5c5d62')
  dish.addColorStop(0.32, '#34353a')
  dish.addColorStop(1, '#17181c')
  ctx.fillStyle = dish
  ctx.strokeStyle = '#68696f'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.ellipse(CENTER_X, 350, 132, 42, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#202126'
  ctx.beginPath()
  ctx.ellipse(CENTER_X, 343, 105, 25, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawWax(ctx: CanvasRenderingContext2D, topY: number, ratio: number) {
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, .35)'
  ctx.shadowBlur = 15
  ctx.shadowOffsetY = 10
  const wax = ctx.createLinearGradient(132, 0, 288, 0)
  wax.addColorStop(0, '#d8c7a5')
  wax.addColorStop(0.18, '#fff4d8')
  wax.addColorStop(0.58, '#f0dfbd')
  wax.addColorStop(1, '#aa9878')
  ctx.fillStyle = wax
  ctx.strokeStyle = 'rgba(255, 246, 222, .52)'
  ctx.lineWidth = 2.5
  traceWaxBody(ctx, topY)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  const waxHeight = WAX_BOTTOM - topY
  const dripHeight = Math.min(46, Math.max(8, waxHeight * 0.24))
  const drip = ctx.createLinearGradient(0, topY, 0, topY + dripHeight)
  drip.addColorStop(0, '#fff4d8')
  drip.addColorStop(1, '#d9c49b')
  ctx.fillStyle = drip
  ;[
    { x: 147, width: 17, height: dripHeight * 0.72 },
    { x: 247, width: 21, height: dripHeight },
  ].forEach(({ x, width, height }) => {
    ctx.beginPath()
    ctx.roundRect(x, topY + 7, width, height, width / 2)
    ctx.fill()
  })

  const top = ctx.createRadialGradient(183, topY + 2, 4, CENTER_X, topY + 8, 78)
  top.addColorStop(0, '#fff8e5')
  top.addColorStop(0.56, '#ecd7ae')
  top.addColorStop(1, '#c4ad84')
  ctx.fillStyle = top
  ctx.beginPath()
  ctx.ellipse(CENTER_X, topY + 7, 76, 25, 0, 0, Math.PI * 2)
  ctx.fill()

  const pool = ctx.createRadialGradient(CENTER_X, topY + 7, 3, CENTER_X, topY + 7, 48)
  pool.addColorStop(0, 'rgba(167, 116, 48, .36)')
  pool.addColorStop(0.72, 'rgba(229, 202, 151, .42)')
  pool.addColorStop(1, 'rgba(255, 247, 224, .12)')
  ctx.fillStyle = pool
  ctx.beginPath()
  ctx.ellipse(CENTER_X, topY + 7, 47, 13, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  traceWaxBody(ctx, topY)
  ctx.clip()
  ctx.fillStyle = 'rgba(255, 255, 255, .2)'
  ctx.beginPath()
  ctx.roundRect(150, topY + 35, 11, Math.max(0, waxHeight - 76), 6)
  ctx.fill()

  ctx.fillStyle = 'rgba(123, 104, 75, .12)'
  for (let index = 0; index < 7; index += 1) {
    const y = topY + 42 + ((index * 37) % Math.max(42, waxHeight - 48))
    const x = 177 + ((index * 43) % 83)
    ctx.beginPath()
    ctx.ellipse(x, y, 1.4 + (index % 2), 3.2, 0.35, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  if (ratio <= 0) {
    ctx.fillStyle = 'rgba(44, 35, 25, .62)'
    ctx.beginPath()
    ctx.ellipse(CENTER_X, topY + 7, 15, 5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawWickAndFlame(
  ctx: CanvasRenderingContext2D,
  topY: number,
  status: CountdownStatus,
  phase: number,
  reducedMotion: boolean,
) {
  ctx.save()
  ctx.strokeStyle = '#38312a'
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(CENTER_X - 1, topY + 9)
  ctx.quadraticCurveTo(CENTER_X - 5, topY - 5, CENTER_X + 1, topY - 15)
  ctx.stroke()

  if (status === 'finished') {
    ctx.fillStyle = '#151515'
    ctx.beginPath()
    ctx.arc(CENTER_X + 1, topY - 15, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  }

  const animated = status === 'running' || status === 'paused'
  const flamePhase = reducedMotion || !animated ? 0 : phase
  const sway = Math.sin(flamePhase * 3.1) * 5
  const pulse = 1 + Math.sin(flamePhase * 4.7) * 0.035
  const flameX = CENTER_X + sway
  const flameBottom = topY - 14
  const flameHeight = 76 * pulse
  const flameWidth = 44 / pulse

  const glow = ctx.createRadialGradient(flameX, flameBottom - 34, 5, flameX, flameBottom - 34, 67)
  glow.addColorStop(0, 'rgba(255, 196, 71, .24)')
  glow.addColorStop(0.48, 'rgba(255, 159, 10, .09)')
  glow.addColorStop(1, 'rgba(255, 159, 10, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(flameX, flameBottom - 34, 67, 0, Math.PI * 2)
  ctx.fill()

  const outer = ctx.createLinearGradient(0, flameBottom - flameHeight, 0, flameBottom)
  outer.addColorStop(0, '#ff7a00')
  outer.addColorStop(0.5, '#ffae12')
  outer.addColorStop(1, '#ffd45e')
  ctx.fillStyle = outer
  ctx.beginPath()
  ctx.moveTo(flameX, flameBottom - flameHeight)
  ctx.bezierCurveTo(
    flameX - flameWidth * 0.2,
    flameBottom - flameHeight * 0.63,
    flameX - flameWidth * 0.58,
    flameBottom - flameHeight * 0.36,
    flameX - flameWidth * 0.4,
    flameBottom - 8,
  )
  ctx.quadraticCurveTo(flameX, flameBottom + 6, flameX + flameWidth * 0.4, flameBottom - 8)
  ctx.bezierCurveTo(
    flameX + flameWidth * 0.64,
    flameBottom - flameHeight * 0.39,
    flameX + flameWidth * 0.2,
    flameBottom - flameHeight * 0.64,
    flameX,
    flameBottom - flameHeight,
  )
  ctx.fill()

  ctx.fillStyle = 'rgba(255, 242, 177, .88)'
  ctx.beginPath()
  ctx.moveTo(flameX, flameBottom - flameHeight * 0.54)
  ctx.bezierCurveTo(flameX - 11, flameBottom - 35, flameX - 12, flameBottom - 13, flameX, flameBottom - 6)
  ctx.bezierCurveTo(flameX + 13, flameBottom - 18, flameX + 9, flameBottom - 36, flameX, flameBottom - flameHeight * 0.54)
  ctx.fill()
  ctx.restore()
}

function drawHolderFront(ctx: CanvasRenderingContext2D) {
  const rim = ctx.createLinearGradient(0, 325, 0, 374)
  rim.addColorStop(0, 'rgba(112, 113, 119, .94)')
  rim.addColorStop(0.34, '#404147')
  rim.addColorStop(1, '#202126')
  ctx.fillStyle = rim
  ctx.beginPath()
  ctx.moveTo(78, 348)
  ctx.bezierCurveTo(98, 382, 156, 397, CENTER_X, 397)
  ctx.bezierCurveTo(264, 397, 322, 382, 342, 348)
  ctx.bezierCurveTo(307, 369, 263, 377, CENTER_X, 377)
  ctx.bezierCurveTo(157, 377, 113, 369, 78, 348)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 255, 255, .2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(CENTER_X, 348, 132, 42, 0, 0, Math.PI)
  ctx.stroke()
}

function drawScene(
  canvas: HTMLCanvasElement,
  model: Omit<CandleTimerCanvasProps, 'className'>,
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
  const waxHeight = MIN_WAX_HEIGHT + ratio * (MAX_WAX_HEIGHT - MIN_WAX_HEIGHT)
  const topY = WAX_BOTTOM - waxHeight
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)
  drawHolderBack(ctx)
  drawWax(ctx, topY, ratio)
  drawWickAndFlame(ctx, topY, model.status, phase, reducedMotion)
  drawHolderFront(ctx)
  ctx.restore()
}

export function CandleTimerCanvas({
  remainingRatio,
  status,
  className,
}: CandleTimerCanvasProps) {
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

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
