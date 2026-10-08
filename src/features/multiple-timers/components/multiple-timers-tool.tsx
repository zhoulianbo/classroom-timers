'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { RoundButton, ToolStage } from '@/features/timer-core/components/tool-stage'
import { useMultipleTimers } from '../hooks/use-multiple-timers'
import { AddTimerDialog } from './add-timer-dialog'
import { TimerCard } from './timer-card'
import styles from './multiple-timers.module.css'

export function MultipleTimersTool() {
  const t = useTranslations('multipleTimers.tool')
  const timer = useMultipleTimers()
  const [adding, setAdding] = useState(false)
  const [page, setPage] = useState(0)
  const shellRef = useRef<HTMLDivElement>(null)
  const pageSize = 6
  const pages = Math.max(1, Math.ceil(timer.timers.length / pageSize))
  const currentPage = Math.min(page, pages - 1)
  const visible = timer.timers.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  const running = timer.timers.filter((item) => item.status === 'running').length
  const keyboardRef = useRef({ act: timer.act, running })
  keyboardRef.current = { act: timer.act, running }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey
        || target?.closest('button, input, select, textarea, a, [contenteditable="true"]')
        || document.querySelector('dialog[open], [role="dialog"]')) return
      if (event.code === 'Space') {
        event.preventDefault()
        keyboardRef.current.act(keyboardRef.current.running ? 'pause' : 'start')
      } else if (event.key.toLowerCase() === 'r') {
        keyboardRef.current.act('reset')
      } else if (event.key.toLowerCase() === 'f') {
        const stage = shellRef.current?.closest('section')
        const request = document.fullscreenElement ? document.exitFullscreen() : stage?.requestFullscreen()
        void request?.catch(() => { /* Fullscreen may be unavailable on this device. */ })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <ToolStage className={styles.stage} settings={(
      <>
        <label className="flex min-h-11 items-center justify-between gap-3"><span>{t('muteAll')}</span><input type="checkbox" checked={timer.muted} onChange={(event) => timer.setMuted(event.target.checked)} /></label>
        <p className="text-xs leading-relaxed text-muted-foreground">{t('savedHint')}</p>
        <button type="button" className="min-h-11 text-primary" onClick={() => timer.setMuted(false)}>{t('defaults')}</button>
      </>
    )}>
      <div ref={shellRef} className={styles.shell}>
        <div className={styles.heading}>
          <span className={styles.summary} style={{ visibility: timer.loaded ? 'visible' : 'hidden' }}>{t('summary', { total: timer.timers.length, running })}</span>
          <p className="text-xs font-medium tracking-widest text-primary uppercase">{t('label')}</p>
        </div>
        {!timer.loaded ? (
          <div className="min-h-0 flex-1" aria-busy="true" />
        ) : visible.length ? (
          <div className={styles.grid}>
            {visible.map((item, index) => (
              <TimerCard key={item.id} timer={item} now={timer.now} disabled={!timer.loaded} name={item.name || t(`defaultName.${item.type}`, { number: item.id === 'initial-countdown' ? 1 : item.id === 'initial-stopwatch' ? 2 : currentPage * pageSize + index + 1 })} onAction={timer.act} onDelete={() => timer.remove(item.id)} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyArea}>
            <AddTimerDialog embedded number={1} onAdd={(config) => { timer.add(config); setPage(0) }} onClose={() => setAdding(false)} onPreview={timer.preview} />
          </div>
        )}
        {timer.loaded && timer.timers.length > 0 ? (
          <div className={styles.footer}>
            <div className={styles.controls}>
              <RoundButton onClick={() => setAdding(true)} disabled={!timer.loaded}>{t('addTimer')}</RoundButton>
              <RoundButton onClick={() => timer.act('reset')} disabled={!timer.loaded || !timer.timers.length}>{t('resetAll')}</RoundButton>
              <RoundButton tone={running ? 'danger' : 'neutral'} onClick={() => timer.act('pause')} disabled={!running}>{t('pauseAll')}</RoundButton>
              <RoundButton tone="success" onClick={() => timer.act('start')} disabled={!timer.loaded || !timer.timers.length || running === timer.timers.length}>{t('startAll')}</RoundButton>
            </div>
            {pages > 1 ? (
              <nav aria-label={t('pages')} className={styles.pagination}>
                <button type="button" className={styles.iconButton} aria-label={t('previous')} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={18} /></button>
                <span className="tnum whitespace-nowrap text-xs">{t('page', { current: currentPage + 1, total: pages })}</span>
                <button type="button" className={styles.iconButton} aria-label={t('next')} disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}><ChevronRight size={18} /></button>
              </nav>
            ) : null}
          </div>
        ) : null}
      </div>
      {adding ? <AddTimerDialog number={timer.timers.length + 1} onAdd={(config) => { timer.add(config); setPage(Math.floor(timer.timers.length / pageSize)) }} onClose={() => setAdding(false)} onPreview={timer.preview} /> : null}
    </ToolStage>
  )
}
