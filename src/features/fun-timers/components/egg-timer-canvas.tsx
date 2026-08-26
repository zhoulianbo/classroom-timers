'use client'

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

type CountdownStatus = 'ready' | 'running' | 'paused' | 'finished'

type EggTimerCanvasProps = {
  remainingRatio: number
  status: CountdownStatus
  className?: string
}

const ARTBOARD = 420
const CENTER_X = 210
const EGG_TOP = 47
const EGG_BOTTOM = 347

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function traceEgg(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.moveTo(CENTER_X, EGG_TOP)
  ctx.bezierCurveTo(137, 51, 92, 159, 92, 256)
  ctx.bezierCurveTo(92, 321, 139, EGG_BOTTOM, CENTER_X, EGG_BOTTOM)
  ctx.bezierCurveTo(281, EGG_BOTTOM, 328, 321, 328, 256)
  ctx.bezierCurveTo(328, 159, 283, 51, CENTER_X, EGG_TOP)
  ctx.closePath()
}

function traceFillSurface(
  ctx: CanvasRenderingContext2D,
  surfaceY: number,
  amplitude: number,
  phase: number,
) {
  const leftY = surfaceY + Math.sin(phase * 2.4) * amplitude
  const centerY = surfaceY + Math.sin(phase * 2.4 + 1.8) * amplitude
  const rightY = surfaceY + Math.sin(phase * 2.4 + 3.6) * amplitude
  ctx.moveTo(76, leftY)
  ctx.bezierCurveTo(130, leftY - amplitude, 166, centerY + amplitude, CENTER_X, centerY)
  ctx.bezierCurveTo(254, centerY - amplitude, 290, rightY + amplitude, 344, rightY)
}

function drawPlateBack(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, .6)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 14
  ctx.fillStyle = 'rgba(0, 0, 0, .42)'
  ctx.beginPath()
  ctx.ellipse(CENTER_X, 376, 150, 24, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const plate = ctx.createLinearGradient(0, 316, 0, 388)
  plate.addColorStop(0, '#77787e')
  plate.addColorStop(0.42, '#414248')
  plate.addColorStop(1, '#202126')
  ctx.fillStyle = plate
  ctx.strokeStyle = 'rgba(255, 255, 255, .28)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(CENTER_X, 350, 150, 38, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  const well = ctx.createRadialGradient(CENTER_X, 340, 18, CENTER_X, 350, 120)
  well.addColorStop(0, '#15161a')
  well.addColorStop(0.72, '#292a30')
  well.addColorStop(1, '#55565c')
  ctx.fillStyle = well
  ctx.strokeStyle = 'rgba(0, 0, 0, .38)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(CENTER_X, 347, 119, 25, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}

function drawEggInterior(
  ctx: CanvasRenderingContext2D,
  ratio: number,
  status: CountdownStatus,
  phase: number,
  reducedMotion: boolean,
) {
  ctx.save()
  traceEgg(ctx)
  ctx.clip()

  const empty = ctx.createLinearGradient(90, 0, 330, 0)
  empty.addColorStop(0, '#32343a')
  empty.addColorStop(0.5, '#202228')
  empty.addColorStop(1, '#111217')
  ctx.fillStyle = empty
  ctx.fillRect(72, 38, 276, 320)

  if (ratio > 0) {
    const fillTop = EGG_TOP - 12
    const fillBottom = EGG_BOTTOM - 10
    const surfaceY = fillBottom - ratio * (fillBottom - fillTop)
    const animated = status === 'running' || status === 'paused'
    const amplitude = animated && !reducedMotion ? 3.5 : 0
    const eggWhite = ctx.createLinearGradient(90, surfaceY, 330, EGG_BOTTOM)
    eggWhite.addColorStop(0, '#fff5d8')
    eggWhite.addColorStop(0.38, '#f2dfb8')
    eggWhite.addColorStop(0.72, '#dcc69e')
    eggWhite.addColorStop(1, '#b59f7b')
    ctx.fillStyle = eggWhite
    ctx.beginPath()
    traceFillSurface(ctx, surfaceY, amplitude, phase)
    ctx.lineTo(344, EGG_BOTTOM + 8)
    ctx.lineTo(76, EGG_BOTTOM + 8)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 248, 225, .72)'
    ctx.lineWidth = 2
    ctx.beginPath()
    traceFillSurface(ctx, surfaceY, amplitude, phase)
    ctx.stroke()

    const availableHeight = EGG_BOTTOM - surfaceY
    const yolkRadius = Math.min(48, availableHeight * 0.3)
    const yolkY = surfaceY + availableHeight * 0.56
    if (yolkRadius > 2) {
      ctx.save()
      ctx.shadowColor = 'rgba(255, 159, 10, .28)'
      ctx.shadowBlur = 12
      const yolk = ctx.createRadialGradient(
        CENTER_X - yolkRadius * 0.32,
        yolkY - yolkRadius * 0.4,
        yolkRadius * 0.08,
        CENTER_X,
        yolkY,
        yolkRadius,
      )
      yolk.addColorStop(0, '#ffe064')
      yolk.addColorStop(0.48, '#ffb20d')
      yolk.addColorStop(1, '#dc7600')
      ctx.fillStyle = yolk
      ctx.strokeStyle = 'rgba(255, 202, 56, .7)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(CENTER_X, yolkY, yolkRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = 'rgba(255, 247, 190, .38)'
      ctx.beginPath()
      ctx.ellipse(
        CENTER_X - yolkRadius * 0.28,
        yolkY - yolkRadius * 0.34,
        yolkRadius * 0.22,
        yolkRadius * 0.12,
        -0.45,
        0,
        Math.PI * 2,
      )
      ctx.fill()
      ctx.restore()
    }

    ctx.fillStyle = 'rgba(255, 255, 255, .24)'
    for (let index = 0; index < 6; index += 1) {
      const y = surfaceY + 18 + ((index * 43) % Math.max(24, availableHeight - 26))
      const x = 136 + ((index * 47) % 150)
      const radius = 1.5 + (index % 3) * 0.65
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
}

function drawEggShell(ctx: CanvasRenderingContext2D) {
  const shell = ctx.createLinearGradient(88, 0, 330, 0)
  shell.addColorStop(0, 'rgba(255, 247, 224, .3)')
  shell.addColorStop(0.2, 'rgba(255, 255, 255, .06)')
  shell.addColorStop(0.66, 'rgba(255, 244, 214, .1)')
  shell.addColorStop(1, 'rgba(167, 151, 122, .3)')
  ctx.fillStyle = shell
  ctx.strokeStyle = 'rgba(247, 236, 210, .74)'
  ctx.lineWidth = 4
  traceEgg(ctx)
  ctx.fill()
  ctx.stroke()

  ctx.save()
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(255, 255, 255, .36)'
  ctx.lineWidth = 11
  ctx.beginPath()
  ctx.bezierCurveTo(150, 84, 119, 145, 116, 206)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255, 255, 255, .12)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.bezierCurveTo(278, 92, 306, 163, 306, 222)
  ctx.stroke()
  ctx.restore()
}

function drawPlateFront(ctx: CanvasRenderingContext2D) {
  const lip = ctx.createLinearGradient(0, 350, 0, 383)
  lip.addColorStop(0, '#5d5e64')
  lip.addColorStop(0.3, '#393a40')
  lip.addColorStop(1, '#202126')
  ctx.fillStyle = lip
  ctx.beginPath()
  ctx.moveTo(60, 350)
  ctx.bezierCurveTo(76, 373, 133, 386, CENTER_X, 386)
  ctx.bezierCurveTo(287, 386, 344, 373, 360, 350)
  ctx.bezierCurveTo(326, 365, 274, 373, CENTER_X, 373)
  ctx.bezierCurveTo(146, 373, 94, 365, 60, 350)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 255, 255, .2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(60, 350)
  ctx.bezierCurveTo(94, 365, 146, 373, CENTER_X, 373)
  ctx.bezierCurveTo(274, 373, 326, 365, 360, 350)
  ctx.stroke()
}

function drawScene(
  canvas: HTMLCanvasElement,
  model: Omit<EggTimerCanvasProps, 'className'>,
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
  drawPlateBack(ctx)
  drawEggInterior(ctx, ratio, model.status, phase, reducedMotion)
  drawEggShell(ctx)
  drawPlateFront(ctx)
  ctx.restore()
}

export function EggTimerCanvas({
  remainingRatio,
  status,
  className,
}: EggTimerCanvasProps) {
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
