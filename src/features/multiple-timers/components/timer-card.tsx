'use client'

import { useRef } from 'react'
import { Pause, Play, RotateCcw, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useFitTextWidth } from '@/features/timer-core/hooks/use-fit-text-width'
import { formatRemainingCountdown, formatStopwatch } from '@/features/timer-core/lib/time'
import { cn } from '@/lib/utils'
import { TIMER_COLORS, timerValue, type TimerState } from '../lib/timers'
import styles from './multiple-timers.module.css'

export function TimerCard({ timer, now, name, disabled, onAction, onDelete }: {
  timer: TimerState
  now: number
  name: string
  disabled: boolean
  onAction: (action: 'start' | 'pause' | 'reset', id: string) => void
  onDelete: () => void
}) {
  const t = useTranslations('multipleTimers.tool')
  const value = timerValue(timer, now)
  const urgent = timer.type === 'countdown' && timer.status === 'running' && value <= 10_000
  const formatted = timer.type === 'countdown' ? formatRemainingCountdown(value) : formatStopwatch(value, 1)
  const carrierRef = useRef<HTMLDivElement>(null)
  const digitsRef = useRef<HTMLSpanElement>(null)
  const fontSize = useFitTextWidth(formatted, carrierRef, digitsRef, { widthRatio: 0.9, heightRatio: 0.75, measureText: '0'.repeat(formatted.length) })
  const action = timer.status === 'running' ? 'pause' : 'start'
  const actionLabel = timer.status === 'paused' ? 'resume' : timer.status === 'finished' ? 'restart' : action
  const ratio = timer.sessionMs > 0 ? Math.min(1, value / timer.sessionMs) : 0

  return (
    <article className={styles.card} aria-label={name} data-status={timer.status}>
      <div className="flex min-h-5 min-w-0 shrink-0 items-center gap-2 pr-9">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: TIMER_COLORS[timer.color] }} aria-hidden="true" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium" title={name}>{name}</h2>
        <button type="button" disabled={disabled} className={`${styles.iconButton} ${styles.deleteButton}`} aria-label={t('deleteNamed', { name })} title={t('delete')} onClick={onDelete}><Trash2 size={16} /></button>
      </div>
      <div className={cn(styles.readout, urgent && 'text-destructive', timer.status === 'finished' && 'text-success')} ref={carrierRef}>
        <span ref={digitsRef} className={cn('tnum whitespace-nowrap leading-none font-normal', timer.type === 'stopwatch' ? 'font-stopwatch' : 'font-countdown')} style={{ fontSize: fontSize ?? 'clamp(1.5rem, 6vw, 8rem)' }}>{formatted}</span>
      </div>
      <div className="my-1 h-1 shrink-0 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
        {timer.type === 'countdown' ? <div className="h-full origin-left" style={{ transform: `scaleX(${ratio})`, backgroundColor: TIMER_COLORS[timer.color] }} /> : null}
      </div>
      <div className={styles.cardFooter}>
        <p className={styles.status} aria-live="polite">
          {t(`statuses.${urgent ? 'urgent' : timer.status}`)}
          {timer.repeat ? <span className="block">{t('cycle', { number: timer.cycles + 1 })}</span> : null}
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" disabled={disabled} className={styles.iconButton} aria-label={t('resetNamed', { name })} title={t('reset')} onClick={() => onAction('reset', timer.id)}><RotateCcw size={18} /></button>
          <button type="button" disabled={disabled} className={cn(styles.iconButton, action === 'pause' ? styles.pause : styles.start)} aria-label={t(`${actionLabel}Named`, { name })} title={t(actionLabel)} onClick={() => onAction(action, timer.id)}>{action === 'pause' ? <Pause size={20} /> : <Play size={20} />}</button>
        </div>
      </div>
    </article>
  )
}
