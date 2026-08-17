'use client'

import type React from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { Expand, Lightbulb, Minimize, Settings2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Tooltip } from '@/components/ui/tooltip'
import { useFullscreen, useWakeLock } from '@/features/timer-core/hooks/use-clock-tools'
import { cn } from '@/lib/utils'

type ToolStageProps = {
  children: React.ReactNode
  /** 舞台右上角额外操作（设置以外） */
  actions?: React.ReactNode
  /**
   * 设置面板内容；缺省时仍显示设置入口并提示暂无可选项。
   * 传 `false` 可完全隐藏设置入口（适用于没有可选项的工具页）。
   */
  settings?: React.ReactNode | false
  className?: string
  style?: React.CSSProperties
}

/**
 * 首屏时钟舞台：占满首屏高度、纯黑底、居中大字。
 * 辅助操作顺序：自定义 actions（如管理城市）→ 常亮 → 设置 → 全屏。
 */
export function ToolStage({
  children,
  actions,
  settings,
  className,
  style,
}: ToolStageProps) {
  const t = useTranslations('toolStage')
  const { ref, isFullscreen, toggle } = useFullscreen<HTMLDivElement>()
  const wakeLock = useWakeLock()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsBtnRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!settingsOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false)
        settingsBtnRef.current?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [settingsOpen])

  const closeSettings = () => {
    setSettingsOpen(false)
    queueMicrotask(() => settingsBtnRef.current?.focus())
  }

  const iconBtn =
    'flex size-9 items-center justify-center rounded-full border border-border/70 transition-colors'

  return (
    <section
      ref={ref}
      style={style}
      data-fullscreen={isFullscreen}
      className={cn(
        'tool-stage relative flex min-h-[calc(100dvh-3.5rem-4.25rem)] flex-col bg-background sm:min-h-[calc(100dvh-4rem)]',
        isFullscreen && 'min-h-dvh',
        className,
      )}
    >
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 sm:top-5 sm:right-5">
        {actions}

        {wakeLock.supported ? (
          <Tooltip label={t('wakeLock')}>
            <button
              type="button"
              onClick={wakeLock.toggle}
              aria-pressed={wakeLock.enabled}
              aria-label={t('wakeLock')}
              className={cn(
                iconBtn,
                wakeLock.enabled
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground',
              )}
            >
              <Lightbulb className="size-4" aria-hidden="true" />
            </button>
          </Tooltip>
        ) : null}

        {settings !== false ? (
          <Tooltip label={t('settings')}>
            <button
              ref={settingsBtnRef}
              type="button"
              onClick={() => setSettingsOpen((open) => !open)}
              aria-label={t('settings')}
              aria-expanded={settingsOpen}
              aria-controls={panelId}
              className={cn(
                iconBtn,
                settingsOpen
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground',
              )}
            >
              <Settings2 className="size-4" aria-hidden="true" />
            </button>
          </Tooltip>
        ) : null}

        <Tooltip label={isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}>
          <button
            type="button"
            onClick={toggle}
            aria-label={isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}
            className={cn(iconBtn, 'bg-secondary/60 text-muted-foreground hover:text-foreground')}
          >
            {isFullscreen ? (
              <Minimize className="size-4" aria-hidden="true" />
            ) : (
              <Expand className="size-4" aria-hidden="true" />
            )}
          </button>
        </Tooltip>
      </div>

      {settingsOpen ? (
        <>
          <button
            type="button"
            className="absolute inset-0 z-30 cursor-default bg-black/40 sm:bg-transparent"
            aria-label={t('close')}
            onClick={closeSettings}
          />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label={t('settingsTitle')}
            className={cn(
              'absolute z-40 flex max-h-[70dvh] flex-col border border-border/70 bg-popover text-popover-foreground shadow-[0_16px_48px_rgba(0,0,0,.4)]',
              /* 手机：底部 Sheet，避开底栏；桌面：右上锚定面板 */
              'inset-x-0 bottom-0 rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:top-16 sm:right-5 sm:bottom-auto sm:w-72 sm:rounded-2xl sm:p-4',
              /* 非全屏时抬到底栏之上 */
              !isFullscreen && 'max-sm:bottom-[4.25rem]',
            )}
          >
            <div className="mb-3 flex shrink-0 items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">{t('settingsTitle')}</h2>
              <button
                type="button"
                onClick={closeSettings}
                aria-label={t('close')}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="-mr-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-4 text-sm [scrollbar-gutter:stable]">
              {settings ?? <p className="text-muted-foreground">{t('settingsEmpty')}</p>}
            </div>
          </div>
        </>
      ) : null}

      {children}
    </section>
  )
}

type RoundButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'neutral' | 'success' | 'danger' | 'primary'
  size?: 'md' | 'lg'
}

/** iOS 时钟风格圆形按钮 */
export function RoundButton({
  tone = 'neutral',
  size = 'lg',
  className,
  ...props
}: RoundButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'round-button flex shrink-0 items-center justify-center rounded-full border font-medium transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40',
        size === 'lg' ? 'size-20 text-[15px] sm:size-24 sm:text-base' : 'size-16 text-sm',
        tone === 'neutral' && 'border-border/60 bg-secondary text-foreground hover:bg-accent',
        tone === 'success' &&
          'border-success/40 bg-success/15 text-success hover:bg-success/25 [&]:shadow-[0_0_40px_-12px_var(--success)]',
        tone === 'danger' &&
          'border-destructive/40 bg-destructive/15 text-destructive hover:bg-destructive/25',
        tone === 'primary' &&
          'border-primary/40 bg-primary text-primary-foreground hover:opacity-90 [&]:shadow-[0_0_40px_-12px_var(--primary)]',
        className,
      )}
      {...props}
    />
  )
}
