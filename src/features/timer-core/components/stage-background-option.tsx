import { Check, LoaderCircle } from 'lucide-react'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

type StageBackgroundOptionProps = {
  label: string
  selected: boolean
  loading?: boolean
  compact?: boolean
  previewClassName?: string
  previewStyle?: CSSProperties
  onSelect: () => void
}

export function StageBackgroundOption({
  label,
  selected,
  loading = false,
  compact = false,
  previewClassName,
  previewStyle,
  onSelect,
}: StageBackgroundOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        compact ? 'p-1' : 'p-1.5',
        selected
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground',
      )}
    >
      <span
        className={cn(
          'relative block overflow-hidden rounded-lg border border-white/15',
          compact ? 'aspect-[5/2]' : 'aspect-[16/10]',
          previewClassName,
        )}
        style={previewStyle}
      >
        {selected ? (
          <span
            className={cn(
              'absolute flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm',
              compact ? 'top-0.5 right-0.5 size-4' : 'top-1 right-1 size-5',
            )}
          >
            {loading ? (
              <LoaderCircle
                className={cn('animate-spin', compact ? 'size-2.5' : 'size-3')}
                aria-hidden="true"
              />
            ) : (
              <Check className={compact ? 'size-2.5' : 'size-3'} aria-hidden="true" />
            )}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          'block truncate px-0.5 text-[10px]',
          compact ? 'mt-1 leading-3.5' : 'mt-1.5 leading-4',
        )}
      >
        {label}
      </span>
    </button>
  )
}
