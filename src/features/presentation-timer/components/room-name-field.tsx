'use client'

import { useTranslations } from 'next-intl'
import { MAX_ROOM_NAME_LENGTH, parseRoomName } from '../lib/room-name'

export function RoomNameField({
  id,
  value,
  onChange,
  t,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  t: ReturnType<typeof useTranslations<'presentationTimer'>>
}) {
  const hintId = `${id}-hint`
  const invalid = value.trim().length > 0 && parseRoomName(value) === null
  return (
    <>
      <label className="block text-sm font-medium" htmlFor={id}>
        {t('landing.roomName')}
      </label>
      <input
        id={id}
        value={value}
        maxLength={MAX_ROOM_NAME_LENGTH}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={invalid}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.value.slice(0, MAX_ROOM_NAME_LENGTH))}
        className="mt-2 h-12 w-full rounded-xl border border-border/70 bg-secondary px-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
      />
      <p
        id={hintId}
        role={invalid ? 'alert' : undefined}
        className={`mt-2 text-sm ${invalid ? 'text-destructive' : 'text-muted-foreground'}`}
      >
        {invalid ? t('errors.invalidRoomName') : t('landing.roomNameHint', { max: MAX_ROOM_NAME_LENGTH })}
      </p>
    </>
  )
}
