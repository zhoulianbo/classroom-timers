'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { ALARM_SOUNDS } from '@/features/timer-core/hooks/use-clock-tools'
import { cn } from '@/lib/utils'
import { AMBIENT_SOUNDS, type AmbientSound } from '../hooks/use-ambient-sound'
import { DEFAULT_PREFERENCES, type Preferences } from '../lib/preferences'

const ALERT_SOUNDS = ['none', ...ALARM_SOUNDS] as const

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5 border-b border-border/50 pb-3 last:border-b-0">
      <h3 className="text-[11px] font-semibold tracking-wide text-foreground/80 uppercase">{title}</h3>
      {children}
    </section>
  )
}

function cellClass(index: number, columns: 2 | 3, count: number) {
  const row = Math.floor(index / columns)
  const col = index % columns
  const lastRow = Math.floor((count - 1) / columns)
  const lastCol = columns - 1
  return cn(
    col !== lastCol && 'border-r border-border',
    row !== lastRow && 'border-b border-border',
    row === 0 && col === 0 && 'rounded-tl-xl',
    row === 0 && col === lastCol && 'rounded-tr-xl',
    row === lastRow && col === 0 && 'rounded-bl-xl',
    row === lastRow && col === lastCol && 'rounded-br-xl',
  )
}

function OptionGroup<T extends AmbientSound | Preferences['alert']>({
  label,
  value,
  options,
  columns = 2,
  onSelect,
}: {
  label: string
  value: T
  options: readonly T[]
  columns?: 2 | 3
  onSelect: (value: T) => void
}) {
  const t = useTranslations('pomodoro.tool')
  return (
    <div className="space-y-1.5">
      <span className="text-muted-foreground">{label}</span>
      <div
        role="group"
        aria-label={label}
        className={cn(
          'grid overflow-hidden rounded-xl border border-border bg-secondary/80',
          columns === 3 ? 'grid-cols-3' : 'grid-cols-2',
        )}
      >
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onSelect(option)}
            className={cn(
              'min-h-11 px-1.5 text-[12px] transition-colors',
              cellClass(index, columns, options.length),
              value === option
                ? 'bg-elevated text-foreground shadow-[inset_0_0_0_1px_var(--primary)]'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {t(`sounds.${option as AmbientSound | Preferences['alert']}`)}
          </button>
        ))}
      </div>
    </div>
  )
}

export function PomodoroSettings({
  preferences,
  locked,
  onChange,
  previewAlert,
  previewAmbient,
}: {
  preferences: Preferences
  locked: boolean
  onChange: (preferences: Preferences) => void
  previewAlert: (sound: Preferences['alert']) => void
  previewAmbient: (sound: AmbientSound) => void
}) {
  const fieldsetRef = useRef<HTMLFieldSetElement>(null)
  useEffect(() => {
    const dialog = fieldsetRef.current?.closest<HTMLElement>('[role="dialog"]')
    if (!dialog) return
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
        ),
      ).filter((element) => !element.matches(':disabled') && element.getClientRects().length > 0)
    focusable()[0]?.focus()
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = focusable()
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    dialog.addEventListener('keydown', trapFocus)
    return () => dialog.removeEventListener('keydown', trapFocus)
  }, [])
  const t = useTranslations('pomodoro.tool')
  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    onChange({ ...preferences, [key]: value })

  return (
    <>
      <fieldset ref={fieldsetRef} disabled={locked} className="space-y-3 disabled:opacity-50">
        <legend className="mb-3 font-medium">{t('timing')}</legend>
        <div className="flex gap-2">
          {[[25, 5], [50, 10]].map(([focus, rest]) => (
            <button
              key={focus}
              type="button"
              aria-pressed={preferences.focus === focus && preferences.break === rest}
              onClick={() => onChange({ ...preferences, focus, break: rest })}
              className="min-h-11 flex-1 rounded-lg border border-border px-3 aria-pressed:border-primary aria-pressed:text-primary"
            >
              {focus} / {rest}
            </button>
          ))}
        </div>
        {(['focus', 'break', 'sessions', 'longBreak'] as const).map((key) => (
          <label key={key} className="flex items-center justify-between gap-3">
            <span>{t(key === 'break' ? 'breakMinutes' : key)}</span>
            <input
              type="number"
              inputMode="numeric"
              aria-label={t(key === 'break' ? 'breakMinutes' : key)}
              min={key === 'longBreak' ? 0 : 1}
              max={key === 'sessions' ? 12 : key === 'focus' ? 120 : 60}
              value={preferences[key]}
              onChange={(event) => {
                const value = event.currentTarget.valueAsNumber
                if (Number.isFinite(value)) {
                  update(
                    key,
                    Math.round(
                      Math.max(
                        Number(event.currentTarget.min),
                        Math.min(Number(event.currentTarget.max), value),
                      ),
                    ),
                  )
                }
              }}
              className="tnum min-h-11 w-20 rounded-lg border border-border bg-secondary px-2 text-center"
            />
          </label>
        ))}
        <p className="text-xs leading-relaxed text-muted-foreground">{t('longBreakHint')}</p>
      </fieldset>
      {locked ? <p className="text-xs text-muted-foreground">{t('locked')}</p> : null}

      <SettingsSection title={t('sound')}>
        <OptionGroup
          label={t('ambient')}
          value={preferences.ambient}
          options={AMBIENT_SOUNDS}
          onSelect={(ambient) => {
            update('ambient', ambient)
            previewAmbient(ambient)
          }}
        />
        <p className="text-xs text-muted-foreground">{t('ambientHint')}</p>
        <label className="block space-y-2">
          <span>
            {t('volume')} · {Math.round(preferences.volume * 100)}%
          </span>
          <input
            aria-label={t('volume')}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={preferences.volume}
            onChange={(event) => update('volume', Number(event.target.value))}
            className="min-h-11 w-full accent-primary"
          />
        </label>
        <OptionGroup
          label={t('alert')}
          value={preferences.alert}
          options={ALERT_SOUNDS}
          columns={2}
          onSelect={(alert) => {
            update('alert', alert)
            previewAlert(alert)
          }}
        />
      </SettingsSection>

      <button
        type="button"
        disabled={locked}
        onClick={() => onChange(DEFAULT_PREFERENCES)}
        className="min-h-9 w-full rounded-lg border border-border/70 bg-secondary/50 px-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      >
        {t('defaults')}
      </button>
    </>
  )
}
