'use client'

import { cn } from '@/lib/utils'
import type { PresentationPhase } from '../types'

export type { PresentationPhase }

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
  const clampedRatio = Math.min(1, Math.max(0, ratio))
  const light = tone === 'light'
  const colors = light
    ? { green: '#14b86a', yellow: '#f5c542', red: '#ef4444' }
    : { green: '#30D158', yellow: '#FFD60A', red: '#FF453A' }
  const elapsed = 1 - clampedRatio
  return (
    <div className="w-full" aria-hidden="true">
      <div
        className={cn(
          'relative overflow-hidden rounded-full',
          compact ? 'h-2' : 'h-4 sm:h-5',
        )}
        style={{ backgroundColor: colors.red }}
      >
        {phase === 'overtime' ? null : (
          <>
            <span
              className="absolute inset-y-0 left-0"
              style={{ width: `${segments.green + segments.yellow}%`, backgroundColor: colors.yellow }}
            />
            <span
              className="absolute inset-y-0 left-0"
              style={{ width: `${segments.green}%`, backgroundColor: colors.green }}
            />
            {elapsed > 0 ? (
              <span
                className={cn('absolute inset-y-0 left-0', light ? 'bg-white/55' : 'bg-black/50')}
                style={{ width: `${elapsed * 100}%` }}
              />
            ) : null}
          </>
        )}
      </div>
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
