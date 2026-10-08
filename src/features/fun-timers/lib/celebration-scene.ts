// Canvas artwork and particle physics adapted from the supplied rocket and
// firecracker demos. Countdown progress is supplied by the shared timer engine.
export type CelebrationKind = 'rocket' | 'fireworks'
export type CelebrationModel = {
  remainingRatio: number
  remainingMs?: number
  status: 'ready' | 'running' | 'paused' | 'finished'
}
export type CelebrationViewport = {
  width: number
  height: number
  groundY: number
  artwork?: { x: number; y: number; size: number }
}
type Point = { x: number; y: number }
type Particle = Point & {
  vx: number; vy: number; life: number; size: number; color: string
  decay: number; gravity: number; kind: 'smoke' | 'spark' | 'burst'
}
type Shell = Point & { vx: number; vy: number; targetY: number; color: string; burstScale: number }
const SIZE = 600
const FIRECRACKER_CAP = { x: 238, y: 312, width: 63, height: 12 }
const COLORS = ['#ff375f', '#ff9f0a', '#ffd60a', '#30d158', '#64d2ff', '#0a84ff', '#bf5af2', '#ffffff']
const color = () => COLORS[Math.floor(Math.random() * COLORS.length)]
const firecrackerPoint = ({ x, y }: Point): Point => ({
  x: 320 + (x - 320) * 1.35,
  y: 350 + (y - 350) * 1.35,
})
const circle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill()
}
function bezier(t: number): Point {
  const mt = 1 - t
  return {
    x: mt ** 3 * (FIRECRACKER_CAP.x + FIRECRACKER_CAP.width / 2) + 3 * mt ** 2 * t * 312 + 3 * mt * t ** 2 * 390 + t ** 3 * 444,
    y: mt ** 3 * (FIRECRACKER_CAP.y + FIRECRACKER_CAP.height / 2) + 3 * mt ** 2 * t * 220 + 3 * mt * t ** 2 * 274 + t ** 3 * 204,
  }
}
function fuse(ctx: CanvasRenderingContext2D, from: number, to: number, stroke: string, width: number) {
  ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.beginPath()
  for (let i = 0; i <= 40; i++) {
    const p = bezier(from + (to - from) * i / 40)
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  }
  ctx.stroke()
}

export function createCelebrationScene(kind: CelebrationKind) {
  // A stable sky avoids jumps when resizing or resetting the countdown.
  const stars = Array.from({ length: 170 }, () => ({
    x: Math.random(), y: Math.random(),
    size: 0.2 + Math.random() * 1.25, alpha: 0.1 + Math.random() * 0.45,
    phase: Math.random() * Math.PI * 2,
  }))
  let particles: Particle[] = []
  let shells: Shell[] = []
  let elapsed = 0
  let celebration = 0
  let lastLaunch = 0
  let emission = 0
  let previousStatus: CelebrationModel['status'] = 'ready'
  let previousProgress = 0
  let worldWidth = SIZE
  let groundY = SIZE * 0.9
  let artwork = { x: 0, y: 0, scale: 1 }
  let rocketEcho = false
  let rocketExploded = false
  let rocketTravel = 190
  let volley = 0
  let warmupStep = -1
  const toStage = (p: Point): Point => ({ x: artwork.x + p.x * artwork.scale, y: artwork.y + p.y * artwork.scale })

  const burst = (x: number, y: number, tint: string, scale = 1) => {
    const count = Math.round(85 * scale)
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 2 * i / count + Math.random() * 0.07
      const speed = (2 + Math.random() * 4.4) * scale
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, size: 1.5 + Math.random() * 2, color: Math.random() > 0.2 ? tint : color(),
        decay: 0.008 + Math.random() * 0.008, gravity: 0.045, kind: 'burst' })
    }
  }
  const launch = (x: number, targetY: number, burstScale = 1) => {
    shells.push({ x, y: groundY + 15, vx: (Math.random() - 0.5) * 0.7,
      vy: -(6.6 + Math.random() * 2.2), targetY, color: color(), burstScale })
  }
  const launchVolley = () => {
    // Spread each volley across the sky, with varied heights and timing.
    const count = worldWidth < 500 ? 3 : 5
    for (let i = 0; i < count; i++) {
      launch(worldWidth * (0.04 + (i + Math.random() * 0.8) / count * 0.92), 65 + Math.random() * 270)
    }
    volley += 1
  }
  const rocketPosition = (progress: number): Point => ({
    x: 300 + Math.sin(progress * 9) * Math.min(10, progress * 12),
    y: 400 - rocketTravel * (1 - (1 - progress) ** 1.55),
  })
  function drawRocket(ctx: CanvasRenderingContext2D, progress: number, lit: boolean, reduced: boolean) {
    const pos = rocketPosition(progress)
    const boost = Math.max(0, (progress - 0.67) / 0.33)
    if (lit) {
      const length = 95 + boost * 100
      const flame = ctx.createLinearGradient(pos.x, pos.y + 60, pos.x, pos.y + 60 + length)
      flame.addColorStop(0, '#fff0b4'); flame.addColorStop(0.25, '#ff9f0a')
      flame.addColorStop(0.65, 'rgba(255,69,58,.55)'); flame.addColorStop(1, 'rgba(255,69,58,0)')
      ctx.fillStyle = flame; ctx.beginPath()
      ctx.moveTo(pos.x - 23, pos.y + 58); ctx.lineTo(pos.x, pos.y + 60 + length)
      ctx.lineTo(pos.x + 23, pos.y + 58); ctx.closePath(); ctx.fill()
    }
    ctx.save()
    ctx.translate(pos.x + (reduced ? 0 : Math.sin(elapsed * 0.045) * 1.5 * boost), pos.y)
    ctx.scale(3.3, 3.3)
    const body = ctx.createLinearGradient(-14, 0, 14, 0)
    body.addColorStop(0, '#bfc2c7'); body.addColorStop(0.5, '#fff'); body.addColorStop(1, '#8f949b')
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(0, -32)
    ctx.quadraticCurveTo(18, -14, 13, 18); ctx.lineTo(-13, 18)
    ctx.quadraticCurveTo(-18, -14, 0, -32); ctx.fill()
    ctx.fillStyle = '#ff453a'; ctx.beginPath(); ctx.moveTo(0, -42)
    ctx.lineTo(9, -27); ctx.lineTo(-9, -27); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#64d2ff'; circle(ctx, 0, -10, 6)
    ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(ctx, -2, -12, 2)
    ctx.fillStyle = '#ff453a'
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(side * 13, 8); ctx.lineTo(side * 25, 23)
      ctx.lineTo(side * 8, 18); ctx.closePath(); ctx.fill()
    }
    ctx.restore()
  }
  function drawFirecracker(ctx: CanvasRenderingContext2D, progress: number, lit: boolean, urgent: boolean) {
    ctx.save()
    ctx.translate(320, 350); ctx.scale(1.35, 1.35); ctx.translate(-320, -350)
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(270, 510, 85, 13, 0, 0, Math.PI * 2); ctx.fill()
    const body = ctx.createLinearGradient(218, 0, 322, 0)
    body.addColorStop(0, '#7a1016'); body.addColorStop(0.46, '#e2363d'); body.addColorStop(1, '#8d1018')
    ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(218, 320, 104, 180, 14); ctx.fill()
    ctx.fillStyle = '#f4c15d'; ctx.fillRect(218, 336, 104, 10); ctx.fillRect(218, 474, 104, 10)
    ctx.fillStyle = 'rgba(255,236,180,.92)'; ctx.font = '700 38px system-ui'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('福', 270, 412)
    ctx.fillStyle = '#351114'; ctx.fillRect(FIRECRACKER_CAP.x, FIRECRACKER_CAP.y, FIRECRACKER_CAP.width, FIRECRACKER_CAP.height)
    const tip = 1 - progress
    fuse(ctx, 0, 1, '#292722', 8)
    fuse(ctx, 0, tip, '#a29468', 7)
    fuse(ctx, 0, tip, 'rgba(245,225,172,.5)', 2)
    if (lit) {
      const p = bezier(tip); const radius = urgent ? 30 : 21
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius)
      glow.addColorStop(0, '#fff3c2'); glow.addColorStop(0.22, 'rgba(255,159,10,.95)')
      glow.addColorStop(1, 'rgba(255,69,58,0)')
      ctx.fillStyle = glow; circle(ctx, p.x, p.y, radius)
      ctx.fillStyle = '#fff3c2'; circle(ctx, p.x, p.y, urgent ? 4.2 : 3.2)
    }
    ctx.restore()
  }
  function emit(progress: number, urgent: boolean) {
    const local = kind === 'rocket' ? rocketPosition(progress) : firecrackerPoint(bezier(1 - progress))
    if (kind === 'rocket') local.y += 60
    const p = toStage(local)
    const scale = artwork.scale
    const boost = kind === 'rocket' ? Math.max(0, (progress - 0.67) / 0.33) : urgent ? 1 : 0
    const count = 1 + Math.floor(boost * 3)
    for (let i = 0; i < count; i++) {
      particles.push({ x: p.x + (Math.random() - 0.5) * 9 * scale, y: p.y,
        vx: (Math.random() - 0.5) * (1.5 + boost) * scale, vy: (kind === 'rocket' ? 2 + Math.random() * 2.4 : -Math.random() * (1.6 + boost)) * scale,
        life: 1, size: (1 + Math.random() * 2) * scale, color: Math.random() > 0.35 ? '#ffd60a' : '#ff9f0a',
        decay: 0.04, gravity: 0.035 * scale, kind: 'spark' })
    }
    if (kind === 'rocket' || Math.random() < 0.1 + boost * 0.2) {
      particles.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 0.65 * scale,
        vy: (kind === 'rocket' ? 1.1 + Math.random() * 1.5 : -0.5) * scale, life: 1, size: (5 + Math.random() * 8) * scale,
        color: '#b7b7b7', decay: 0.013, gravity: 0, kind: 'smoke' })
    }
  }
  function update(dt: number) {
    const step = dt * 0.06
    shells = shells.filter((s) => {
      s.x += s.vx * step; s.y += s.vy * step; s.vy += 0.018 * step
      if (s.y <= s.targetY || s.vy >= -1.2) { burst(s.x, s.y, s.color, s.burstScale); return false }
      return true
    })
    particles = particles.filter((p) => {
      p.x += p.vx * step; p.y += p.vy * step; p.vy += p.gravity * step
      p.life -= p.decay * step
      if (p.kind === 'burst') p.vx *= Math.pow(0.992, step)
      if (p.kind === 'smoke') p.size += dt * 0.008 * artwork.scale
      return p.life > 0
    })
  }
  function drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life) * (p.kind === 'smoke' ? 0.23 : 1)
      ctx.fillStyle = p.color; circle(ctx, p.x, p.y, p.size)
      if (p.kind === 'burst') {
        ctx.strokeStyle = p.color; ctx.lineWidth = p.size * 0.8; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(p.x - p.vx * 3, p.y - p.vy * 3)
        ctx.lineTo(p.x, p.y); ctx.stroke()
        ctx.globalAlpha *= 0.18; circle(ctx, p.x, p.y, p.size * 3)
      }
    }
    for (const s of shells) {
      ctx.globalAlpha = 0.95; ctx.fillStyle = '#fff'; circle(ctx, s.x, s.y, 2.4)
      const trail = ctx.createLinearGradient(s.x, s.y, s.x, s.y + 42)
      trail.addColorStop(0, '#fff'); trail.addColorStop(0.3, '#ff9f0a'); trail.addColorStop(1, 'rgba(255,69,58,0)')
      ctx.strokeStyle = trail; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x, s.y + 2); ctx.lineTo(s.x, s.y + 42); ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
  return {
    draw(canvas: HTMLCanvasElement, model: CelebrationModel, viewport: CelebrationViewport, dt: number, reduced: boolean) {
      if (viewport.width <= 0 || viewport.height <= 0) return false
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return false
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.round(viewport.width * dpr), height = Math.round(viewport.height * dpr)
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      // Keep physics in a 600-unit-tall world, with the full hero's aspect ratio.
      // Only the rocket/firecracker uses the square layout anchor.
      const scale = height / SIZE
      const units = SIZE / viewport.height
      const nextWidth = viewport.width * units
      if (nextWidth !== worldWidth) {
        for (const p of [...particles, ...shells]) p.x *= nextWidth / worldWidth
      }
      worldWidth = nextWidth
      groundY = viewport.groundY * units
      if (viewport.artwork) {
        const artScale = viewport.artwork.size / viewport.height
        const base = kind === 'fireworks' ? firecrackerPoint({ x: 270, y: 500 }) : { x: 300, y: 400 + 23 * 3.3 }
        artwork = {
          x: viewport.width < 640 ? worldWidth * 0.14 - base.x * artScale : viewport.artwork.x * units,
          y: groundY - base.y * artScale,
          scale: artScale,
        }
        // Place the nose eight CSS pixels below the hero's top, independent of
        // the square artwork anchor used to size the rocket on the ground.
        const top = 42 * 3.3 * artScale + 8 * units
        rocketTravel = Math.max(0, 400 - (top - artwork.y) / artScale)
      }
      ctx.scale(scale, scale)
      const progress = Math.min(1, Math.max(0, 1 - model.remainingRatio))
      if (model.status === 'ready' || (model.status !== 'finished' && (previousStatus === 'finished' || progress < previousProgress))) {
        particles = []; shells = []; elapsed = 0; celebration = 0; emission = 0; lastLaunch = 0; rocketEcho = false; rocketExploded = false; volley = 0; warmupStep = -1
      }
      if (model.status === 'finished' && previousStatus !== 'finished') {
        if (kind === 'rocket') { particles = []; shells = [] }
        celebration = 0
        if (!reduced) {
          if (kind === 'fireworks') {
            const p = toStage(firecrackerPoint({ x: 270, y: 390 }))
            burst(p.x, p.y, '#ff9f0a', 1.35)
            launchVolley()
          }
        }
      }
      previousStatus = model.status; previousProgress = progress
      const moving = !reduced && (model.status === 'running' || model.status === 'finished')
      if (moving) {
        elapsed += dt
        if (model.status === 'running') {
          const remainingMs = model.remainingMs ?? Infinity
          if (kind === 'fireworks' && remainingMs > 0 && remainingMs <= 5000) {
            // At most three small shells, scheduled from the authoritative timer.
            // Skip missed launches after a background jump instead of catching up.
            const step = Math.min(2, Math.floor((5000 - remainingMs) / 1600))
            if (step > warmupStep) {
              launch(worldWidth * (0.2 + step * 0.3), groundY * (0.25 + Math.random() * 0.2), 0.55)
              warmupStep = step
            }
          }
          emission += dt
          while (emission >= 1000 / 60) { if (viewport.artwork) emit(progress, (model.remainingMs ?? 0) <= 10000); emission -= 1000 / 60 }
        } else {
          celebration += dt
          if (kind === 'rocket' && celebration >= 140 && !rocketExploded) {
            const p = toStage(rocketPosition(1))
            for (let ring = 0; ring < 3; ring++) burst(p.x, p.y, color(), 1.3 + ring * 0.2)
            rocketExploded = true
          }
          if (kind === 'rocket' && celebration >= 500 && !rocketEcho) {
            burst(worldWidth * 0.62, 140, color(), 1.2)
            burst(worldWidth * 0.85, 275, color(), 1.1)
            rocketEcho = true
          }
          if (kind === 'fireworks' && celebration < 6500 && celebration - lastLaunch > (volley % 2 ? 300 : 400)) {
            launchVolley(); lastLaunch = celebration
          }
        }
        update(dt)
      }
      if (reduced) {
        particles = []; shells = []
        if (model.status === 'finished') { celebration = 6500; rocketEcho = true; rocketExploded = true }
      }
      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, worldWidth, SIZE)
      const starCount = Math.min(stars.length, Math.max(48, Math.round(viewport.width * viewport.height / 8000)))
      for (let i = 0; i < starCount; i++) {
        const star = stars[i]
        ctx.globalAlpha = Math.max(0.05, star.alpha + (reduced ? 0 : Math.sin(elapsed * 0.0015 + star.phase) * 0.1))
        ctx.fillStyle = '#fff'; circle(ctx, star.x * worldWidth, star.y * groundY, star.size)
      }
      ctx.globalAlpha = 1
      if (kind === 'fireworks') {
        const ground = ctx.createLinearGradient(0, groundY, 0, SIZE)
        ground.addColorStop(0, '#151414'); ground.addColorStop(1, '#080808')
        ctx.fillStyle = ground; ctx.fillRect(0, groundY, worldWidth, SIZE - groundY)
      }
      const glowX = worldWidth * (kind === 'rocket' ? 0.5 : 0.42)
      const glowY = kind === 'rocket' ? SIZE - 50 : groundY
      const glowRadius = kind === 'rocket' ? worldWidth * 0.55 : Math.min(worldWidth * 0.42, SIZE * 0.55)
      const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowRadius)
      glow.addColorStop(0, kind === 'rocket' ? 'rgba(255,159,10,.12)' : 'rgba(255,80,40,.10)')
      glow.addColorStop(1, 'rgba(255,80,40,0)')
      ctx.fillStyle = glow
      const glowTop = kind === 'rocket' ? SIZE * 0.55 : groundY
      ctx.fillRect(0, glowTop, worldWidth, (kind === 'rocket' ? groundY : SIZE) - glowTop)
      if (kind === 'rocket') {
        ctx.fillStyle = '#0b0b0c'; ctx.fillRect(0, groundY, worldWidth, SIZE - groundY)
        ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1 / scale; ctx.lineCap = 'butt'
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(worldWidth, groundY); ctx.stroke()
      }
      if ((model.status !== 'finished' || (kind === 'rocket' && !rocketExploded)) && viewport.artwork) {
        ctx.save(); ctx.translate(artwork.x, artwork.y); ctx.scale(artwork.scale, artwork.scale)
        const lit = model.status !== 'ready'
        if (kind === 'rocket') drawRocket(ctx, model.status === 'finished' ? 1 : progress, lit, reduced)
        else drawFirecracker(ctx, progress, lit, (model.remainingMs ?? Infinity) <= 10000)
        ctx.restore()
      }
      drawParticles(ctx)
      canvas.dataset.particles = String(particles.length + shells.length)
      return moving && (model.status === 'running' || particles.length > 0 || shells.length > 0 || (kind === 'rocket' && !rocketEcho) || (kind === 'fireworks' && celebration < 6500))
    },
  }
}
