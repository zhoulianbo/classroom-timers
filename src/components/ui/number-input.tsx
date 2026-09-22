'use client'

import { useEffect, useRef, useState, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type NumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'min' | 'max' | 'inputMode'
> & {
  value: number
  min?: number
  max?: number
  onValueChange: (value: number) => void
}

function clampNumber(value: number, min: number, max?: number) {
  let next = Math.round(value)
  if (!Number.isFinite(next)) next = min
  next = Math.max(min, next)
  if (max !== undefined) next = Math.min(max, next)
  return next
}

/**
 * Digit field that can be fully cleared while editing.
 * Empty shows placeholder 0; the committed value is clamped on blur.
 */
export function NumberInput({
  value,
  min = 0,
  max,
  onValueChange,
  onBlur,
  onFocus,
  onKeyDown,
  className,
  placeholder = '0',
  ...props
}: NumberInputProps) {
  const focusedRef = useRef(false)
  const [text, setText] = useState(() => String(value))

  useEffect(() => {
    if (!focusedRef.current) setText(String(value))
  }, [value])

  const commit = (raw: string) => {
    const parsed = raw.trim() === '' ? NaN : Number(raw)
    const next = clampNumber(parsed, min, max)
    onValueChange(next)
    setText(String(next))
  }

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      enterKeyHint="done"
      autoComplete="off"
      placeholder={placeholder}
      value={text}
      onFocus={(event) => {
        focusedRef.current = true
        setText(String(value))
        onFocus?.(event)
      }}
      onChange={(event) => {
        const next = event.currentTarget.value.replace(/\D/g, '')
        setText(next)
        if (next === '') return
        const parsed = Number(next)
        if (!Number.isFinite(parsed)) return
        if (parsed < min) return
        if (max !== undefined && parsed > max) return
        onValueChange(parsed)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
        onKeyDown?.(event)
      }}
      onBlur={(event) => {
        focusedRef.current = false
        commit(event.currentTarget.value)
        onBlur?.(event)
      }}
      className={cn('tnum', className)}
    />
  )
}
