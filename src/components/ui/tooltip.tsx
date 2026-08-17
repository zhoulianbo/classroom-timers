'use client'

import type React from 'react'
import { cn } from '@/lib/utils'

type TooltipProps = {
  label: string
  children: React.ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

/**
 * 轻量 Tooltip：悬停 / 键盘聚焦时显示，不影响触控主路径。
 */
export function Tooltip({ label, children, side = 'bottom', className }: TooltipProps) {
  const sideClass =
    side === 'top'
      ? 'bottom-full left-1/2 mb-2 -translate-x-1/2'
      : side === 'left'
        ? 'top-1/2 right-full mr-2 -translate-y-1/2'
        : side === 'right'
          ? 'top-1/2 left-full ml-2 -translate-y-1/2'
          : 'top-full left-1/2 mt-2 -translate-x-1/2'

  return (
    <span className={cn('group/tooltip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border/70 bg-popover px-2 py-1 text-[11px] text-popover-foreground opacity-0 shadow-[0_8px_24px_rgba(0,0,0,.4)] transition-opacity max-sm:hidden',
          'group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100',
          sideClass,
        )}
      >
        {label}
      </span>
    </span>
  )
}
