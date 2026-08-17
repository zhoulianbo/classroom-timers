'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const ITEM_H = 40
const HOUR_VALUES = Array.from({ length: 24 }, (_, i) => i)
const MINUTE_VALUES = Array.from({ length: 60 }, (_, i) => i)
const SECOND_VALUES = Array.from({ length: 60 }, (_, i) => i)

type WheelColumnProps = {
  values: number[]
  value: number
  onChange: (v: number) => void
  unit: string
  label: string
}

function clampIndex(scrollTop: number, length: number) {
  return Math.min(length - 1, Math.max(0, Math.round(scrollTop / ITEM_H)))
}

/** iOS 风格滚动选择列：滚动即时高亮，停稳后吸附并回写 */
function WheelColumn({ values, value, onChange, unit, label }: WheelColumnProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const userScrollRef = useRef(false)
  const settleRef = useRef(0)
  const releaseRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, values.indexOf(value)))

  valueRef.current = value
  onChangeRef.current = onChange

  // 仅在非用户滚动时，把受控 value 同步到滚动位置
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el || userScrollRef.current) return
    const index = values.indexOf(value)
    if (index < 0) return
    setActiveIndex(index)
    const target = index * ITEM_H
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTop = target
    }
  }, [value, values])

  useEffect(() => {
    const el = listRef.current
    if (!el) return

    const releaseUserScroll = () => {
      window.clearTimeout(releaseRef.current)
      releaseRef.current = window.setTimeout(() => {
        userScrollRef.current = false
      }, 50)
    }

    const settle = () => {
      const index = clampIndex(el.scrollTop, values.length)
      const target = index * ITEM_H
      setActiveIndex(index)

      if (Math.abs(el.scrollTop - target) > 1) {
        el.scrollTo({ top: target, behavior: 'smooth' })
      }

      const next = values[index]
      if (next !== undefined && next !== valueRef.current) {
        onChangeRef.current(next)
      }
      releaseUserScroll()
    }

    const onScroll = () => {
      userScrollRef.current = true
      const index = clampIndex(el.scrollTop, values.length)
      setActiveIndex(index)

      window.clearTimeout(settleRef.current)
      settleRef.current = window.setTimeout(settle, 80)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.clearTimeout(settleRef.current)
      window.clearTimeout(releaseRef.current)
    }
  }, [values])

  const selectIndex = (index: number) => {
    const el = listRef.current
    if (!el) return
    userScrollRef.current = true
    setActiveIndex(index)
    el.scrollTo({ top: index * ITEM_H, behavior: 'smooth' })
    const next = values[index]
    if (next !== undefined && next !== valueRef.current) {
      onChangeRef.current(next)
    }
    window.clearTimeout(settleRef.current)
    window.clearTimeout(releaseRef.current)
    releaseRef.current = window.setTimeout(() => {
      userScrollRef.current = false
    }, 180)
  }

  return (
    <div className="flex flex-1 flex-col items-center">
      <span className="mb-1 text-[11px] tracking-wide text-muted-foreground">{label}</span>
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        className="h-[120px] w-full snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingBlock: ITEM_H }}
      >
        <div style={{ height: ITEM_H }} aria-hidden="true" />
        {values.map((v, index) => {
          const selected = index === activeIndex
          return (
            <button
              key={v}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => selectIndex(index)}
              className={cn(
                'flex w-full snap-center items-center justify-center gap-1 tnum transition-colors',
                selected ? 'text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground',
              )}
              style={{ height: ITEM_H }}
            >
              <span className={cn('text-xl font-medium', selected && 'text-2xl')}>{v}</span>
              <span className="text-[11px]">{unit}</span>
            </button>
          )
        })}
        <div style={{ height: ITEM_H }} aria-hidden="true" />
      </div>
    </div>
  )
}

type WheelPickerProps = {
  hours: number
  minutes: number
  seconds: number
  onChange: (next: { hours: number; minutes: number; seconds: number }) => void
  className?: string
}

export function WheelPicker({
  hours,
  minutes,
  seconds,
  onChange,
  className,
}: WheelPickerProps) {
  const t = useTranslations('countdown.wheel')
  const onChangeRef = useRef(onChange)
  const stateRef = useRef({ hours, minutes, seconds })
  onChangeRef.current = onChange
  stateRef.current = { hours, minutes, seconds }

  const setHours = (next: number) => {
    const current = stateRef.current
    onChangeRef.current({ hours: next, minutes: current.minutes, seconds: current.seconds })
  }
  const setMinutes = (next: number) => {
    const current = stateRef.current
    onChangeRef.current({ hours: current.hours, minutes: next, seconds: current.seconds })
  }
  const setSeconds = (next: number) => {
    const current = stateRef.current
    onChangeRef.current({ hours: current.hours, minutes: current.minutes, seconds: next })
  }

  return (
    <div className={cn('relative w-full max-w-xs rounded-2xl bg-card/60 p-3', className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-1/2 h-10 -translate-y-1/2 rounded-lg bg-accent/50"
        style={{ marginTop: 10 }}
      />
      <div className="relative flex gap-1">
        <WheelColumn
          label={t('hours')}
          unit={t('hourUnit')}
          values={HOUR_VALUES}
          value={hours}
          onChange={setHours}
        />
        <WheelColumn
          label={t('minutes')}
          unit={t('minuteUnit')}
          values={MINUTE_VALUES}
          value={minutes}
          onChange={setMinutes}
        />
        <WheelColumn
          label={t('seconds')}
          unit={t('secondUnit')}
          values={SECOND_VALUES}
          value={seconds}
          onChange={setSeconds}
        />
      </div>
    </div>
  )
}
