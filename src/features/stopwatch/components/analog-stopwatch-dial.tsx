'use client'

import { useEffect, useRef } from 'react'
import { formatStopwatch } from '@/features/timer-core/lib/time'

type AnalogStopwatchDialProps = {
  elapsed: number
  laps: number[]
  precision: 1 | 2 | 3
  elapsedTimeLabel: string
}

type DialSnapshot = Pick<AnalogStopwatchDialProps, 'elapsed' | 'laps'>

const TAU = Math.PI * 2

function pointOnCircle(center: number, radius: number, angle: number) {
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  }
}

function drawHand(
  context: CanvasRenderingContext2D,
  center: number,
  radius: number,
  angle: number,
  color: string,
  width: number,
  tailRatio: number,
) {
  const tip = pointOnCircle(center, radius, angle)
  const tail = pointOnCircle(center, radius * tailRatio, angle + Math.PI)

  context.beginPath()
  context.moveTo(tail.x, tail.y)
  context.lineTo(tip.x, tip.y)
  context.strokeStyle = color
  context.lineWidth = width
  context.lineCap = 'round'
  context.stroke()
}

function drawDial(canvas: HTMLCanvasElement, snapshot: DialSnapshot) {
  const rect = canvas.getBoundingClientRect()
  const size = Math.min(rect.width, rect.height)
  if (size <= 0) return

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  const pixelSize = Math.round(size * pixelRatio)
  if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
    canvas.width = pixelSize
    canvas.height = pixelSize
  }

  const context = canvas.getContext('2d')
  if (!context) return

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, size, size)

  const center = size / 2
  const radius = size * 0.455
  const elapsedSeconds = snapshot.elapsed / 1000
  const previousLap = snapshot.laps.at(-1) ?? 0
  const currentLapSeconds = Math.max(0, snapshot.elapsed - previousLap) / 1000

  context.strokeStyle = 'rgba(245, 245, 247, 0.2)'
  context.lineWidth = Math.max(1, size * 0.004)
  context.beginPath()
  context.arc(center, center, radius, 0, TAU)
  context.stroke()

  for (let tick = 0; tick < 60; tick += 1) {
    const angle = (tick / 60) * TAU - Math.PI / 2
    const isMajor = tick % 5 === 0
    const outer = pointOnCircle(center, radius, angle)
    const inner = pointOnCircle(center, radius - size * (isMajor ? 0.035 : 0.018), angle)

    context.beginPath()
    context.moveTo(inner.x, inner.y)
    context.lineTo(outer.x, outer.y)
    context.strokeStyle = isMajor ? '#f5f5f7' : 'rgba(245, 245, 247, 0.28)'
    context.lineWidth = Math.max(1, size * (isMajor ? 0.008 : 0.004))
    context.stroke()
  }

  context.fillStyle = '#f5f5f7'
  context.font = `300 ${size * 0.072}px system-ui, sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  for (let second = 0; second < 60; second += 5) {
    const label = second === 0 ? '60' : String(second)
    const angle = (second / 60) * TAU - Math.PI / 2
    const point = pointOnCircle(center, radius * 0.76, angle)
    context.fillText(label, point.x, point.y)
  }

  const subCenterY = center - size * 0.18
  const subRadius = size * 0.135
  context.beginPath()
  context.arc(center, subCenterY, subRadius, 0, TAU)
  context.strokeStyle = 'rgba(245, 245, 247, 0.18)'
  context.lineWidth = Math.max(1, size * 0.003)
  context.stroke()

  for (let minute = 0; minute < 30; minute += 1) {
    const angle = (minute / 30) * TAU - Math.PI / 2
    const outer = {
      x: center + Math.cos(angle) * subRadius,
      y: subCenterY + Math.sin(angle) * subRadius,
    }
    const innerRadius = subRadius - size * (minute % 5 === 0 ? 0.018 : 0.01)
    const inner = {
      x: center + Math.cos(angle) * innerRadius,
      y: subCenterY + Math.sin(angle) * innerRadius,
    }
    context.beginPath()
    context.moveTo(inner.x, inner.y)
    context.lineTo(outer.x, outer.y)
    context.strokeStyle = minute % 5 === 0 ? '#f5f5f7' : 'rgba(245, 245, 247, 0.25)'
    context.lineWidth = Math.max(1, size * (minute % 5 === 0 ? 0.005 : 0.003))
    context.stroke()
  }

  context.fillStyle = '#f5f5f7'
  context.font = `400 ${size * 0.034}px system-ui, sans-serif`
  for (let minute = 0; minute < 30; minute += 5) {
    const label = minute === 0 ? '30' : String(minute)
    const angle = (minute / 30) * TAU - Math.PI / 2
    const labelRadius = subRadius * 0.68
    context.fillText(
      label,
      center + Math.cos(angle) * labelRadius,
      subCenterY + Math.sin(angle) * labelRadius,
    )
  }

  const minuteAngle = ((elapsedSeconds / 60) % 30) / 30 * TAU - Math.PI / 2
  const minuteTip = {
    x: center + Math.cos(minuteAngle) * subRadius * 0.72,
    y: subCenterY + Math.sin(minuteAngle) * subRadius * 0.72,
  }
  context.beginPath()
  context.moveTo(center, subCenterY)
  context.lineTo(minuteTip.x, minuteTip.y)
  context.strokeStyle = '#ff9f0a'
  context.lineWidth = Math.max(2, size * 0.008)
  context.lineCap = 'round'
  context.stroke()
  context.beginPath()
  context.arc(center, subCenterY, Math.max(2, size * 0.009), 0, TAU)
  context.fillStyle = '#ff9f0a'
  context.fill()

  const lapAngle = (currentLapSeconds % 60) / 60 * TAU - Math.PI / 2
  const totalAngle = (elapsedSeconds % 60) / 60 * TAU - Math.PI / 2
  drawHand(context, center, radius * 0.91, lapAngle, '#64d2ff', Math.max(2, size * 0.008), 0.13)
  drawHand(context, center, radius * 0.94, totalAngle, '#ff9f0a', Math.max(2, size * 0.009), 0.16)

  context.beginPath()
  context.arc(center, center, Math.max(4, size * 0.013), 0, TAU)
  context.fillStyle = '#0b0b0c'
  context.fill()
  context.strokeStyle = '#ff9f0a'
  context.lineWidth = Math.max(2, size * 0.008)
  context.stroke()
}

export function AnalogStopwatchDial({
  elapsed,
  laps,
  precision,
  elapsedTimeLabel,
}: AnalogStopwatchDialProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snapshotRef = useRef<DialSnapshot>({ elapsed, laps })
  const elapsedTime = formatStopwatch(elapsed, precision)
  const [elapsedClock, elapsedFraction] = elapsedTime.split('.')
  snapshotRef.current = { elapsed, laps }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawDial(canvas, snapshotRef.current)
  }, [elapsed, laps])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver(() => drawDial(canvas, snapshotRef.current))
    resizeObserver.observe(canvas)
    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div className="analog-stopwatch-dial relative aspect-square" data-testid="analog-stopwatch-dial">
      <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden="true" />
      <time
        className="analog-stopwatch-time font-stopwatch absolute top-[69%] left-1/2 -translate-x-1/2 text-[clamp(0.9rem,4.5vw,1.45rem)] font-normal whitespace-nowrap tnum sm:text-[clamp(1rem,2.4vw,1.55rem)]"
        aria-label={elapsedTimeLabel}
      >
        <span>{elapsedClock}</span>
        <span className="text-[0.72em]">.{elapsedFraction}</span>
      </time>
    </div>
  )
}
