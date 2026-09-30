'use client'

import { cn } from '@/lib/utils'
import type { PresentationPhase } from '../types'

export type { PresentationPhase }

export function PresentationProgressBar({
  ratio,
  phase,
  segments,
  tone = 'dark',
  compact = false,
  edgeToEdge = false,
}: {
  ratio: number
  phase: PresentationPhase
  segments: { green: number; yellow: number; red: number }
  tone?: 'dark' | 'light'
  compact?: boolean
  edgeToEdge?: boolean
}) {
  const clampedRatio = Math.min(1, Math.max(0, ratio))
  const light = tone === 'light'
  const colors = light
    ? { green: '#14b86a', yellow: '#f5c542', red: '#ef4444', elapsed: '#E5E5EA' }
    : { green: '#30D158', yellow: '#FFD60A', red: '#FF453A', elapsed: '#2C2C2E' }
  const elapsed = 1 - clampedRatio

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        edgeToEdge ? 'h-4 sm:h-6' : compact ? 'h-2 rounded-full' : 'h-4 rounded-full sm:h-5',
      )}
      style={{ backgroundColor: phase === 'overtime' ? colors.red : colors.elapsed }}
      aria-hidden="true"
    >
      {phase === 'overtime' ? null : (
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${elapsed * 100}%)` }}
        >
          <span
            className="absolute inset-y-0 left-0"
            style={{ width: `${segments.green + segments.yellow}%`, backgroundColor: colors.yellow }}
          />
          <span
            className="absolute inset-y-0 left-0"
            style={{ width: `${segments.green}%`, backgroundColor: colors.green }}
          />
          <span
            className="absolute inset-y-0 right-0"
            style={{ width: `${segments.red}%`, backgroundColor: colors.red }}
          />
        </div>
      )}
    </div>
  )
}

export function PresentationProgress({
  ratio,
  phase,
  labels,
  segments,
  tone = 'dark',
  compact = false,
  showLabels = true,
}: {
  ratio: number
  phase: PresentationPhase
  labels: { green: string; yellow: string; red: string }
  segments: { green: number; yellow: number; red: number }
  tone?: 'dark' | 'light'
  compact?: boolean
  showLabels?: boolean
}) {
  const light = tone === 'light'
  return (
    <div className="w-full" aria-hidden="true">
      <PresentationProgressBar
        ratio={ratio}
        phase={phase}
        segments={segments}
        tone={tone}
        compact={compact}
      />
      {showLabels ? (
        <div
          className={cn(
            'mt-2 flex text-[10px] font-medium tracking-[0.14em] uppercase sm:text-xs',
            light ? 'text-black/45' : 'text-muted-foreground',
          )}
        >
          <span style={{ width: `${segments.green}%` }}>{labels.green}</span>
          <span style={{ width: `${segments.yellow}%` }}>{labels.yellow}</span>
          <span style={{ width: `${segments.red}%` }} className="text-right">{labels.red}</span>
        </div>
      ) : null}
    </div>
  )
}
