'use client'

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

type PopcornTimerCanvasProps = {
  durationMs: number
  remainingMs?: number
  status: 'ready' | 'running' | 'paused' | 'finished'
  className?: string
}

type PopcornParticle = {
  kind: 'kernel' | 'popcorn'
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  rotation: number
  angularVelocity: number
  tone: number
}

type PopcornSimulation = {
  count: number
  particles: PopcornParticle[]
  popSchedule: number[]
  poppedCount: number
  lidKick: number
  random: () => number
  lastFrameAt: number
  settledFrames: number
}

const ARTBOARD = 420
const KERNEL_COUNT = 60
const POT_INNER_LEFT = 72
const POT_INNER_RIGHT = 348
const POT_CEILING = 119
const POT_FLOOR = 349

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function seededRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let mixed = value
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

export function getPopcornKernelCount() {
  return KERNEL_COUNT
}

function createPopSchedule(count: number) {
  return Array.from({ length: count }, (_, index) => (index + 1) / count)
}

function createSimulation(count: number, seed: number): PopcornSimulation {
  const random = seededRandom(seed ^ count ^ 0x504f5043)
  const kernelRadius = clamp(8.2 - (count - 60) / 145, 6.8, 8.2)
  const horizontalSpacing = kernelRadius * 2 + 0.1
  const rowOffset = horizontalSpacing / 2
  const verticalSpacing = Math.sqrt(horizontalSpacing * horizontalSpacing - rowOffset * rowOffset)
  const potInnerWidth = POT_INNER_RIGHT - POT_INNER_LEFT
  const columns = Math.max(
    1,
    Math.floor((potInnerWidth - kernelRadius * 2 - rowOffset) / horizontalSpacing) + 1,
  )
  const rows = Math.ceil(count / columns)
  const occupiedWidth = kernelRadius * 2 + (columns - 1) * horizontalSpacing + rowOffset
  const occupiedHeight = kernelRadius * 2 + (rows - 1) * verticalSpacing
  const startX = POT_INNER_LEFT + kernelRadius + (potInnerWidth - occupiedWidth) / 2
  const freeVerticalSpace = POT_FLOOR - POT_CEILING - occupiedHeight
  const startY = POT_CEILING + kernelRadius + Math.min(19, Math.max(0, freeVerticalSpace / 3))
  const slots = Array.from({ length: rows * columns }, (_, index) => index)

  for (let index = slots.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = slots[index]
    slots[index] = slots[swapIndex]
    slots[swapIndex] = current
  }

  const particles = Array.from({ length: count }, (_, index): PopcornParticle => {
    const slot = slots[index]
    const column = slot % columns
    const row = Math.floor(slot / columns)
    const jitter = 0.02
    return {
      kind: 'kernel',
      x: startX + column * horizontalSpacing + (row % 2 === 0 ? 0 : rowOffset) + (random() - 0.5) * jitter,
      y: startY + row * verticalSpacing + (random() - 0.5) * jitter,
      vx: (random() - 0.5) * 1.4,
      vy: random() * 0.35,
      radius: kernelRadius * (0.9 + random() * 0.1),
      rotation: (random() - 0.5) * 1.2,
      angularVelocity: 0,
      tone: random(),
    }
  })

  return {
    count,
    particles,
    popSchedule: createPopSchedule(count),
    poppedCount: 0,
    lidKick: 0,
    random,
    lastFrameAt: 0,
    settledFrames: 0,
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius)
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius)
  ctx.arcTo(x, y + height, x, y, safeRadius)
  ctx.arcTo(x, y, x + width, y, safeRadius)
  ctx.closePath()
}

function drawFlame(ctx: CanvasRenderingContext2D, x: number, height: number, phase: number, alpha: number) {
  const sway = Math.sin(phase + x * 0.08) * 3
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, 385)
  ctx.fillStyle = '#ff9f0a'
  ctx.beginPath()
  ctx.moveTo(-9, 0)
  ctx.bezierCurveTo(-13, -12, sway - 4, -height * 0.66, sway, -height)
  ctx.bezierCurveTo(sway + 10, -height * 0.55, 13, -13, 9, 0)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#ffd60a'
  ctx.beginPath()
  ctx.moveTo(-4, 0)
  ctx.bezierCurveTo(-6, -8, sway * 0.45, -height * 0.45, sway * 0.4, -height * 0.65)
  ctx.bezierCurveTo(6, -height * 0.35, 6, -7, 4, 0)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawBurner(ctx: CanvasRenderingContext2D, status: PopcornTimerCanvasProps['status'], elapsedMs: number) {
  ctx.save()
  ctx.strokeStyle = '#727278'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(92, 389)
  ctx.lineTo(328, 389)
  ctx.stroke()

  if (status === 'running' || status === 'paused') {
    const alpha = status === 'paused' ? 0.62 : 1
    const phase = elapsedMs / 115
    for (let index = 0; index < 9; index += 1) {
      drawFlame(ctx, 112 + index * 24.5, 19 + (index % 3) * 3, phase + index * 0.7, alpha)
    }
  }
  ctx.restore()
}

function drawPotBase(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.strokeStyle = '#77787f'
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(65, 205, 27, Math.PI * 0.55, Math.PI * 1.45)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(355, 205, 27, -Math.PI * 0.45, Math.PI * 0.45)
  ctx.stroke()

  const body = ctx.createLinearGradient(64, 126, 356, 350)
  body.addColorStop(0, '#393a40')
  body.addColorStop(0.48, '#24262c')
  body.addColorStop(1, '#17191e')
  roundedRect(ctx, 64, 111, 292, 254, 18)
  ctx.fillStyle = body
  ctx.fill()
  ctx.strokeStyle = '#64656c'
  ctx.lineWidth = 5
  ctx.stroke()

  const inner = ctx.createLinearGradient(74, 128, 346, 350)
  inner.addColorStop(0, 'rgba(255,255,255,.035)')
  inner.addColorStop(1, 'rgba(0,0,0,.08)')
  roundedRect(ctx, 74, 125, 272, 224, 11)
  ctx.fillStyle = inner
  ctx.fill()
  ctx.restore()
}

function drawLid(ctx: CanvasRenderingContext2D, lidKick: number) {
  ctx.save()
  ctx.translate(0, -lidKick)
  ctx.fillStyle = '#8e8f96'
  ctx.strokeStyle = '#55565d'
  ctx.lineWidth = 3
  roundedRect(ctx, 50, 96, 320, 17, 8)
  ctx.fill()
  ctx.stroke()

  const knob = ctx.createRadialGradient(201, 84, 2, 210, 86, 15)
  knob.addColorStop(0, '#a9abb1')
  knob.addColorStop(1, '#62636a')
  ctx.fillStyle = knob
  ctx.beginPath()
  ctx.arc(210, 87, 11, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawKernel(ctx: CanvasRenderingContext2D, particle: PopcornParticle) {
  ctx.save()
  ctx.translate(particle.x, particle.y)
  ctx.rotate(particle.rotation)
  const kernel = ctx.createRadialGradient(
    -particle.radius * 0.2,
    -particle.radius * 0.3,
    1,
    0,
    0,
    particle.radius,
  )
  kernel.addColorStop(0, '#ffd966')
  kernel.addColorStop(0.55, '#ffb30a')
  kernel.addColorStop(1, '#b96e00')
  ctx.fillStyle = kernel
  ctx.strokeStyle = '#7e4c00'
  ctx.lineWidth = 1.1
  ctx.beginPath()
  ctx.ellipse(0, 0, particle.radius, particle.radius * 0.78, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawPopcorn(ctx: CanvasRenderingContext2D, particle: PopcornParticle) {
  ctx.save()
  ctx.translate(particle.x, particle.y)
  ctx.rotate(particle.rotation)
  ctx.strokeStyle = particle.tone > 0.5 ? '#d7bd69' : '#d9c88e'
  ctx.lineWidth = Math.max(1.2, particle.radius * 0.075)
  ctx.fillStyle = particle.tone > 0.62 ? '#fff5c9' : '#fff9df'

  const lobes = [
    [-0.37, -0.1, 0.42],
    [0.34, -0.12, 0.4],
    [-0.12, -0.4, 0.43],
    [0.08, 0.32, 0.43],
  ] as const
  for (const [offsetX, offsetY, radius] of lobes) {
    ctx.beginPath()
    ctx.arc(
      offsetX * particle.radius,
      offsetY * particle.radius,
      radius * particle.radius,
      0,
      Math.PI * 2,
    )
    ctx.fill()
    ctx.stroke()
  }

  ctx.fillStyle = '#f2c34c'
  ctx.beginPath()
  ctx.ellipse(
    0,
    particle.radius * 0.04,
    particle.radius * 0.22,
    particle.radius * 0.18,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()
  ctx.restore()
}

function popOne(simulation: PopcornSimulation, reducedMotion: boolean) {
  const kernels = simulation.particles.filter((particle) => particle.kind === 'kernel')
  if (kernels.length === 0) return

  const particle = kernels[Math.floor(simulation.random() * kernels.length)]
  simulation.poppedCount += 1
  particle.kind = 'popcorn'
  particle.radius = clamp(11.5 - (simulation.count - 60) / 60, 6.4, 11.5)
    * (0.86 + simulation.random() * 0.24)
  particle.rotation = simulation.random() * Math.PI * 2
  particle.tone = simulation.random()

  if (reducedMotion) {
    particle.vx = 0
    particle.vy = 0
    particle.angularVelocity = 0
    return
  }

  particle.vx = (simulation.random() - 0.5) * 8.4
  particle.vy = -(8.8 + simulation.random() * 6.8)
  particle.angularVelocity = (simulation.random() - 0.5) * 0.32
}

function resolveParticleCollisions(particles: PopcornParticle[]) {
  const largestRadius = particles.reduce((largest, particle) => Math.max(largest, particle.radius), 1)
  const cellSize = largestRadius * 2.15
  const grid = new Map<number, number[]>()

  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index]
    const column = Math.floor(particle.x / cellSize)
    const row = Math.floor(particle.y / cellSize)
    const key = row * 1000 + column
    const bucket = grid.get(key)
    if (bucket) bucket.push(index)
    else grid.set(key, [index])
  }

  let overlapCount = 0
  for (let firstIndex = 0; firstIndex < particles.length; firstIndex += 1) {
    const first = particles[firstIndex]
    const firstColumn = Math.floor(first.x / cellSize)
    const firstRow = Math.floor(first.y / cellSize)

    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        const bucket = grid.get((firstRow + rowOffset) * 1000 + firstColumn + columnOffset)
        if (!bucket) continue

        for (const secondIndex of bucket) {
          if (secondIndex <= firstIndex) continue
          const second = particles[secondIndex]
          const deltaX = second.x - first.x
          const deltaY = second.y - first.y
          const minimumDistance = first.radius + second.radius
          const distanceSquared = deltaX * deltaX + deltaY * deltaY
          if (distanceSquared >= minimumDistance * minimumDistance) continue

          overlapCount += 1
          const distance = Math.sqrt(Math.max(0.01, distanceSquared))
          const normalX = deltaX / distance
          const normalY = deltaY / distance
          const overlap = (minimumDistance - distance) * 0.5
          first.x -= normalX * overlap
          first.y -= normalY * overlap
          second.x += normalX * overlap
          second.y += normalY * overlap

          const relativeVelocity = (second.vx - first.vx) * normalX + (second.vy - first.vy) * normalY
          if (relativeVelocity < 0) {
            const impulse = relativeVelocity * 0.38
            first.vx += impulse * normalX
            first.vy += impulse * normalY
            second.vx -= impulse * normalX
            second.vy -= impulse * normalY
          }
        }
      }
    }
  }
  return overlapCount
}

function clampParticleToPot(particle: PopcornParticle, simulation: PopcornSimulation) {
  const restitution = particle.kind === 'popcorn' ? 0.48 : 0.22

  if (particle.x - particle.radius < POT_INNER_LEFT) {
    particle.x = POT_INNER_LEFT + particle.radius
    particle.vx = Math.abs(particle.vx) * restitution
  } else if (particle.x + particle.radius > POT_INNER_RIGHT) {
    particle.x = POT_INNER_RIGHT - particle.radius
    particle.vx = -Math.abs(particle.vx) * restitution
  }

  if (particle.y + particle.radius > POT_FLOOR) {
    particle.y = POT_FLOOR - particle.radius
    particle.vy = Math.abs(particle.vy) < 0.65 ? 0 : -Math.abs(particle.vy) * restitution
    particle.vx *= 0.84
  }

  if (particle.y - particle.radius < POT_CEILING) {
    particle.y = POT_CEILING + particle.radius
    if (particle.vy < 0) {
      simulation.lidKick = Math.min(7, simulation.lidKick + -particle.vy * 0.09)
      particle.vy = Math.abs(particle.vy) * restitution * 0.72
    }
  }
}

function stepSimulation(simulation: PopcornSimulation, frameScale: number) {
  simulation.lidKick *= Math.pow(0.82, frameScale)
  let maximumSpeed = 0

  for (const particle of simulation.particles) {
    particle.vy += 0.38 * frameScale
    particle.x += particle.vx * frameScale
    particle.y += particle.vy * frameScale
    particle.vx *= Math.pow(0.991, frameScale)

    if (particle.kind === 'popcorn') {
      particle.rotation += particle.angularVelocity * frameScale
      particle.angularVelocity *= Math.pow(0.9, frameScale)
    }
    clampParticleToPot(particle, simulation)
  }

  resolveParticleCollisions(simulation.particles)
  resolveParticleCollisions(simulation.particles)
  resolveParticleCollisions(simulation.particles)
  for (const particle of simulation.particles) {
    clampParticleToPot(particle, simulation)
    maximumSpeed = Math.max(maximumSpeed, Math.abs(particle.vx), Math.abs(particle.vy))
  }

  simulation.settledFrames = maximumSpeed < 0.12 ? simulation.settledFrames + 1 : 0
}

function drawParticles(ctx: CanvasRenderingContext2D, simulation: PopcornSimulation) {
  ctx.save()
  roundedRect(ctx, POT_INNER_LEFT, POT_CEILING, POT_INNER_RIGHT - POT_INNER_LEFT, POT_FLOOR - POT_CEILING, 10)
  ctx.clip()

  const kernels = simulation.particles
    .filter((particle) => particle.kind === 'kernel')
    .sort((first, second) => first.y - second.y)
  const popcorn = simulation.particles
    .filter((particle) => particle.kind === 'popcorn')
    .sort((first, second) => first.y - second.y)

  for (const particle of kernels) drawKernel(ctx, particle)
  // Popcorn is intentionally a separate upper layer so fluffy pieces remain
  // visually above the unpopped kernels as the pot fills.
  for (const particle of popcorn) drawPopcorn(ctx, particle)
  ctx.restore()
}

function getElapsedProgress(model: Omit<PopcornTimerCanvasProps, 'className'>) {
  const durationMs = Math.max(1, model.durationMs)
  if (model.status === 'ready') return 0
  if (model.status === 'finished') return 1
  return clamp((durationMs - (model.remainingMs ?? durationMs)) / durationMs, 0, 1)
}

function getTargetPopCount(simulation: PopcornSimulation, progress: number) {
  let low = 0
  let high = simulation.popSchedule.length
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (simulation.popSchedule[middle] <= progress) low = middle + 1
    else high = middle
  }
  return low
}

function drawPotFinish(ctx: CanvasRenderingContext2D) {
  ctx.save()
  const sheen = ctx.createLinearGradient(72, 130, 348, 348)
  sheen.addColorStop(0, 'rgba(255,255,255,.055)')
  sheen.addColorStop(0.35, 'rgba(255,255,255,0)')
  sheen.addColorStop(1, 'rgba(0,0,0,.16)')
  roundedRect(ctx, 72, 119, 276, 238, 10)
  ctx.fillStyle = sheen
  ctx.fill()

  ctx.strokeStyle = '#ff9f0a'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(92, 352)
  ctx.lineTo(328, 352)
  ctx.stroke()
  ctx.restore()
}

function drawScene(
  canvas: HTMLCanvasElement,
  simulation: PopcornSimulation,
  model: Omit<PopcornTimerCanvasProps, 'className'>,
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
  const durationMs = Math.max(1, model.durationMs)
  const elapsedMs = getElapsedProgress(model) * durationMs

  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)
  drawBurner(ctx, model.status, elapsedMs)
  drawPotBase(ctx)
  drawParticles(ctx, simulation)
  drawPotFinish(ctx)
  drawLid(ctx, simulation.lidKick)
  ctx.restore()
}

export function PopcornTimerCanvas({
  durationMs,
  remainingMs,
  status,
  className,
}: PopcornTimerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const kernelCount = getPopcornKernelCount()
  const simulationRef = useRef<PopcornSimulation | null>(null)
  const modelRef = useRef({ durationMs, remainingMs, status })
  const previousStatusRef = useRef(status)
  const resetSequenceRef = useRef(0)
  const frameRef = useRef(0)
  const animateRef = useRef<(now: number) => void>(() => {})
  modelRef.current = { durationMs, remainingMs, status }

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const simulation = simulationRef.current
    if (!canvas || !simulation) return
    drawScene(canvas, simulation, modelRef.current)
    const progress = getElapsedProgress(modelRef.current)
    canvas.dataset.kernelCount = String(simulation.count)
    canvas.dataset.poppedCount = String(simulation.poppedCount)
    canvas.dataset.progress = progress.toFixed(4)
  }, [])

  const scheduleFrame = useCallback(() => {
    if (frameRef.current !== 0) return
    frameRef.current = requestAnimationFrame((now) => animateRef.current(now))
  }, [])

  animateRef.current = (now: number) => {
    frameRef.current = 0
    const simulation = simulationRef.current
    if (!simulation) return

    const model = modelRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const progress = getElapsedProgress(model)
    const targetPopCount = model.status === 'finished'
      ? simulation.count
      : getTargetPopCount(simulation, progress)
    let popBudget = model.status === 'finished' ? 10 : 3
    while (simulation.poppedCount < targetPopCount && popBudget > 0) {
      popOne(simulation, reducedMotion)
      popBudget -= 1
    }

    const elapsedSinceFrame = simulation.lastFrameAt === 0 ? 16.67 : now - simulation.lastFrameAt
    simulation.lastFrameAt = now
    if (model.status !== 'paused') {
      stepSimulation(simulation, clamp(elapsedSinceFrame / 16.67, 0.35, 2))
    }
    render()

    const shouldContinue = model.status === 'running'
      || (model.status === 'ready' && simulation.settledFrames < 18)
      || (model.status === 'finished' && simulation.settledFrames < 24)
    if (shouldContinue) scheduleFrame()
  }

  useLayoutEffect(() => {
    const previousStatus = previousStatusRef.current
    const needsLayout = simulationRef.current?.count !== kernelCount
      || (status === 'ready' && previousStatus !== 'ready')
    if (needsLayout || !simulationRef.current) {
      resetSequenceRef.current += 1
      simulationRef.current = createSimulation(
        kernelCount,
        (Date.now() & 0xffffffff) ^ resetSequenceRef.current,
      )
    }

    previousStatusRef.current = status
    if (simulationRef.current) simulationRef.current.lastFrameAt = 0
    render()
    if (status !== 'paused') scheduleFrame()
  }, [kernelCount, render, scheduleFrame, status])

  useLayoutEffect(render)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => {
      render()
      if (modelRef.current.status !== 'paused') scheduleFrame()
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [render, scheduleFrame])

  useEffect(() => {
    if (modelRef.current.status !== 'paused') scheduleFrame()
    return () => {
      if (frameRef.current !== 0) cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
    }
  }, [scheduleFrame])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      data-kernel-count={kernelCount}
      data-popped-count="0"
      data-progress="0.0000"
      aria-hidden="true"
    />
  )
}
