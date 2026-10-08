'use client'

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Check, Volume2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { RoundButton } from '@/features/timer-core/components/tool-stage'
import { ALARM_SOUNDS } from '@/features/timer-core/hooks/use-clock-tools'
import { TIMER_COLORS, type TimerConfig } from '../lib/timers'
import styles from './multiple-timers.module.css'

export function AddTimerDialog({ number, onAdd, onClose, onPreview, embedded = false }: {
  number: number
  onAdd: (config: TimerConfig) => void
  onClose: () => void
  onPreview: (sound: TimerConfig['sound']) => void
  embedded?: boolean
}) {
  const t = useTranslations('multipleTimers.tool')
  const soundT = useTranslations('countdown.settings')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [name, setName] = useState('')
  const [type, setType] = useState<TimerConfig['type']>('countdown')
  const [mode, setMode] = useState<'duration' | 'untilDate'>('duration')
  const [hours, setHours] = useState('0')
  const [minutes, setMinutes] = useState('5')
  const [seconds, setSeconds] = useState('0')
  const [date, setDate] = useState(() => {
    const next = new Date(Date.now() + 3_600_000)
    return new Date(next.getTime() - next.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
  })
  const [sound, setSound] = useState<TimerConfig['sound']>('chime')
  const [repeat, setRepeat] = useState(false)
  const [color, setColor] = useState<TimerConfig['color']>('green')
  const [error, setError] = useState<'invalidDuration' | 'invalidDate' | null>(null)

  useEffect(() => {
    if (embedded) return
    const dialog = dialogRef.current
    const trigger = document.activeElement as HTMLElement | null
    dialog?.showModal()
    return () => {
      dialog?.close()
      trigger?.focus()
    }
  }, [embedded])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const targetAt = type === 'countdown' && mode === 'untilDate' ? new Date(date).getTime() : null
    const durationMs = type === 'stopwatch' ? 0 : targetAt !== null
      ? targetAt - Date.now() : (Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)) * 1000
    if (type === 'countdown' && (!Number.isFinite(durationMs) || durationMs <= 0)) {
      setError(mode === 'untilDate' ? 'invalidDate' : 'invalidDuration')
      return
    }
    onAdd({
      id: crypto.randomUUID(), name: name.trim() || t(`defaultName.${type}`, { number }),
      type, durationMs, targetAt, sound: type === 'stopwatch' ? 'none' : sound,
      repeat: type === 'countdown' && mode === 'duration' && repeat, color,
    })
    onClose()
  }

  const form = (
    <form onSubmit={submit} className={embedded ? styles.inlineForm : 'space-y-5 p-6'} aria-labelledby={titleId}>
      <h2 id={titleId} className="text-lg font-semibold">{t('addTimer')}</h2>
      <label className={styles.field}>
        <span>{t('name')}</span>
        <input autoFocus={!embedded} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder={t(`defaultName.${type}`, { number })} />
      </label>
      <fieldset>
        <legend className={styles.legend}>{t('type')}</legend>
        <div className={styles.segment}>
          {(['countdown', 'stopwatch'] as const).map((value) => (
            <button key={value} type="button" aria-pressed={type === value} onClick={() => { setType(value); setError(null) }}>{t(value)}</button>
          ))}
        </div>
      </fieldset>
      {type === 'countdown' ? (
        <>
          <fieldset>
            <legend className={styles.legend}>{t('duration')}</legend>
            <div className={styles.segment}>
              {(['duration', 'untilDate'] as const).map((value) => (
                <button key={value} type="button" aria-pressed={mode === value} onClick={() => { setMode(value); setError(null) }}>{t(value)}</button>
              ))}
            </div>
            {mode === 'duration' ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {([
                  ['hours', hours, setHours, 99], ['minutes', minutes, setMinutes, 59], ['seconds', seconds, setSeconds, 59],
                ] as const).map(([key, value, setter, max]) => (
                  <label key={key} className={styles.field}>
                    <span>{t(key)}</span>
                    <input type="number" inputMode="numeric" min={0} max={max} step={1} required value={value} onChange={(event) => { setter(event.target.value); setError(null) }} />
                  </label>
                ))}
              </div>
            ) : (
              <label className={`${styles.field} mt-3`}>
                <span>{t('localDate')}</span>
                <input type="datetime-local" required value={date} onChange={(event) => { setDate(event.target.value); setError(null) }} />
              </label>
            )}
          </fieldset>
          <div className="flex items-end gap-3">
            <label className={`${styles.field} min-w-0 flex-1`}>
              <span>{t('alarm')}</span>
              <select aria-label={t('alarm')} value={sound} onChange={(event) => setSound(event.target.value as TimerConfig['sound'])}>
                <option value="none">{t('noSound')}</option>
                {ALARM_SOUNDS.map((value) => <option key={value} value={value}>{soundT(`sounds.${value}`)}</option>)}
              </select>
            </label>
            <button type="button" className={styles.iconButton} aria-label={t('preview')} title={t('preview')} disabled={sound === 'none'} onClick={() => onPreview(sound)}><Volume2 size={18} /></button>
            {mode === 'duration' ? (
              <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={repeat} onChange={(event) => setRepeat(event.target.checked)} />{t('repeat')}</label>
            ) : null}
          </div>
        </>
      ) : null}
      <fieldset>
        <legend className={styles.legend}>{t('color')}</legend>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(TIMER_COLORS) as TimerConfig['color'][]).map((value) => (
            <button key={value} type="button" className="flex size-11 items-center justify-center rounded-full" aria-label={t(`colors.${value}`)} aria-pressed={color === value} onClick={() => setColor(value)}>
              <span className="flex size-8 items-center justify-center rounded-full text-black" style={{ backgroundColor: TIMER_COLORS[value] }}>{color === value ? <Check size={20} /> : null}</span>
            </button>
          ))}
        </div>
      </fieldset>
      {error ? <p role="alert" className="text-sm text-destructive">{t(error)}</p> : null}
      <div className="flex justify-end gap-3">
        {!embedded ? <RoundButton size="md" onClick={onClose}>{t('cancel')}</RoundButton> : null}
        <RoundButton size="md" type="submit" tone="primary">{t('add')}</RoundButton>
      </div>
    </form>
  )

  if (embedded) return <div className={styles.inlinePanel}>{form}</div>

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onCancel={onClose}>
      {form}
    </dialog>
  )
}
