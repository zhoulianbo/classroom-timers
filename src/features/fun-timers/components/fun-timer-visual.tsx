import { cn } from '@/lib/utils'
import type { FunTimerKey } from '../data'
import { BombTimerCanvas } from './bomb-timer-canvas'
import { CandleTimerCanvas } from './candle-timer-canvas'
import { EggTimerCanvas } from './egg-timer-canvas'
import { PopcornTimerCanvas } from './popcorn-timer-canvas'
import { SandTimerCanvas } from './sand-timer-canvas'
import styles from './fun-timer-visual.module.css'

type TrafficPhase = 'green' | 'yellow' | 'red'

type FunTimerVisualProps = {
  timerKey: FunTimerKey
  remainingRatio: number
  durationMs?: number
  remainingMs?: number
  status?: 'ready' | 'running' | 'paused' | 'finished'
  trafficPhase?: TrafficPhase
  proportional?: boolean
  urgent?: boolean
  compact?: boolean
  thumbnail?: boolean
  finishLabel?: string
}

const rainbowColors = ['#ff453a', '#ff9f0a', '#ffd60a', '#30d158', '#0a84ff', '#bf5af2']
const rainbowMinuteLabels = Array.from({ length: 12 }, (_, index) => index * 5)
const rainbowTicks = Array.from({ length: 60 }, (_, index) => index)
const RAINBOW_MAX_MS = 60 * 60 * 1000

function svgNumber(value: number) {
  return Number(value.toFixed(4))
}

export function FunTimerVisual({
  timerKey,
  remainingRatio,
  durationMs = 1,
  remainingMs,
  status = 'ready',
  trafficPhase = 'green',
  proportional = true,
  urgent = false,
  compact = false,
  thumbnail = false,
  finishLabel = '',
}: FunTimerVisualProps) {
  const ratio = Math.min(1, Math.max(0, remainingRatio))
  const shellClass = cn(
    styles.visual,
    compact && styles.compact,
    thumbnail && styles.thumbnail,
    (timerKey === 'bomb' || timerKey === 'popcorn' || timerKey === 'rainbow' || timerKey === 'sand' || timerKey === 'traffic' || timerKey === 'candle' || timerKey === 'egg') && !compact && !thumbnail && styles.featuredVisual,
    urgent && styles.urgent,
  )

  if (timerKey === 'bomb') {
    return (
      <div className={shellClass} aria-hidden="true">
        <BombTimerCanvas
          remainingMs={remainingMs}
          status={status}
          urgent={urgent}
          finishLabel={finishLabel}
          className={styles.bombCanvas}
        />
      </div>
    )
  }

  if (timerKey === 'popcorn') {
    return (
      <div className={shellClass} aria-hidden="true">
        <PopcornTimerCanvas
          durationMs={durationMs}
          remainingMs={remainingMs}
          status={status}
          className={styles.popcornCanvas}
        />
      </div>
    )
  }

  if (timerKey === 'rainbow') {
    const absoluteRemainingRatio = Math.min(
      1,
      Math.max(0, (remainingMs ?? durationMs * ratio) / RAINBOW_MAX_MS),
    )
    const sweepRatio = proportional ? ratio : absoluteRemainingRatio
    const sweepDegrees = svgNumber(sweepRatio * 360)
    const arcRotation = svgNumber(-90 - sweepDegrees)
    const center = 170
    const tickOuterRadius = 143
    const labelRadius = 157

    return (
      <div className={shellClass} aria-hidden="true">
        <div className={styles.rainbowDial}>
          <svg viewBox="0 0 340 340">
            <circle className={styles.rainbowDialFace} cx={center} cy={center} r="145" />
            {rainbowTicks.map((minute) => {
              const angle = (minute / 60) * Math.PI * 2 - Math.PI / 2
              const innerRadius = minute % 5 === 0 ? 134 : 138
              return (
                <line
                  key={minute}
                  className={minute % 5 === 0 ? styles.rainbowMajorTick : styles.rainbowMinorTick}
                  x1={svgNumber(center + Math.cos(angle) * innerRadius)}
                  y1={svgNumber(center + Math.sin(angle) * innerRadius)}
                  x2={svgNumber(center + Math.cos(angle) * tickOuterRadius)}
                  y2={svgNumber(center + Math.sin(angle) * tickOuterRadius)}
                />
              )
            })}
            {!proportional
              ? rainbowMinuteLabels.map((minute, index) => {
                  const angle = (minute / 60) * Math.PI * 2 - Math.PI / 2
                  return (
                    <text
                      key={minute}
                      className={styles.rainbowMinuteLabel}
                      x={svgNumber(center + Math.cos(angle) * labelRadius)}
                      y={svgNumber(center + Math.sin(angle) * labelRadius)}
                      fill={rainbowColors[index % rainbowColors.length]}
                    >
                      {minute}
                    </text>
                  )
                })
              : null}
            {rainbowColors.map((color, index) => {
              const radius = 111 - index * 18
              const circumference = Math.PI * 2 * radius
              return (
                <g key={color}>
                  <circle
                    className={styles.rainbowTrack}
                    cx={center}
                    cy={center}
                    r={radius}
                    strokeWidth="18"
                  />
                  <circle
                    className={styles.rainbowArc}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth="18"
                    strokeDasharray={`${svgNumber(circumference * sweepRatio)} ${svgNumber(circumference)}`}
                    transform={`rotate(${arcRotation} ${center} ${center})`}
                  />
                </g>
              )
            })}
            <circle className={styles.rainbowHub} cx={center} cy={center} r="16" />
            {Array.from({ length: 12 }, (_, index) => {
              const angle = (index / 12) * Math.PI * 2 - Math.PI / 2
              return (
                <line
                  key={index}
                  className={styles.rainbowHubTick}
                  x1={svgNumber(center + Math.cos(angle) * 8)}
                  y1={svgNumber(center + Math.sin(angle) * 8)}
                  x2={svgNumber(center + Math.cos(angle) * 12)}
                  y2={svgNumber(center + Math.sin(angle) * 12)}
                />
              )
            })}
          </svg>
        </div>
      </div>
    )
  }

  if (timerKey === 'sand') {
    return (
      <div className={shellClass} aria-hidden="true">
        <SandTimerCanvas
          remainingRatio={ratio}
          status={status}
          className={styles.sandCanvas}
        />
      </div>
    )
  }

  if (timerKey === 'traffic') {
    return (
      <div className={shellClass} aria-hidden="true">
        <div className={styles.trafficHousing}>
          <span className={styles.lampBay}>
            <span className={cn(styles.lamp, styles.lampRed, trafficPhase === 'red' && styles.active)} />
          </span>
          <span className={styles.lampBay}>
            <span className={cn(styles.lamp, styles.lampYellow, trafficPhase === 'yellow' && styles.active)} />
          </span>
          <span className={styles.lampBay}>
            <span className={cn(styles.lamp, styles.lampGreen, trafficPhase === 'green' && styles.active)} />
          </span>
        </div>
      </div>
    )
  }

  if (timerKey === 'candle') {
    return (
      <div className={shellClass} aria-hidden="true">
        <CandleTimerCanvas
          remainingRatio={ratio}
          status={status}
          className={styles.candleCanvas}
        />
      </div>
    )
  }

  if (timerKey === 'egg') {
    return (
      <div className={shellClass} aria-hidden="true">
        <EggTimerCanvas
          remainingRatio={ratio}
          status={status}
          className={styles.eggCanvas}
        />
      </div>
    )
  }

  return null
}
