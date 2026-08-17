'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, Plus, Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toIntlLocale, type Locale } from '@/config/i18n'
import { ToolStage } from '@/features/timer-core/components/tool-stage'
import { useNow } from '@/features/timer-core/hooks/use-clock-tools'
import { getZonedParts } from '@/features/timer-core/lib/time'
import { AnalogClock } from '@/features/world-clock/components/analog-clock'
import { WorldMap } from '@/features/world-clock/components/world-map'
import {
  CITIES,
  DEFAULT_CITY_IDS,
  getCityName,
  getCitySearchText,
  getCountryName,
} from '@/features/world-clock/data/cities'
import {
  formatCityTime,
  formatUtcOffset,
  getRelativeOffsetHours,
  getTimeZoneOffsetMinutes,
} from '@/features/world-clock/lib/time-zone'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'classroomtimers.world-clock'

type CitySort = 'custom' | 'name' | 'offset'

type StoredWorldClock = {
  selectedIds: string[]
  use24Hour: boolean
  sort: CitySort
  showDayNight: boolean
}

type WorldClockToolProps = {
  locale: Locale
}

function SettingsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

export function WorldClockTool({ locale }: WorldClockToolProps) {
  const t = useTranslations('worldClock.tool')
  const now = useNow(1000)
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_CITY_IDS)
  const [activeId, setActiveId] = useState(DEFAULT_CITY_IDS[0])
  const [managerOpen, setManagerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [use24Hour, setUse24Hour] = useState(true)
  const [sort, setSort] = useState<CitySort>('custom')
  const [showDayNight, setShowDayNight] = useState(true)
  const [storageReady, setStorageReady] = useState(false)
  const managerButtonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoredWorldClock>
        const validIds = Array.isArray(parsed.selectedIds)
          ? parsed.selectedIds.filter((id) => CITIES.some((city) => city.id === id))
          : []

        if (validIds.length) {
          setSelectedIds(validIds)
          setActiveId(validIds[0])
        }
        if (typeof parsed.use24Hour === 'boolean') setUse24Hour(parsed.use24Hour)
        if (parsed.sort === 'custom' || parsed.sort === 'name' || parsed.sort === 'offset') {
          setSort(parsed.sort)
        }
        if (typeof parsed.showDayNight === 'boolean') setShowDayNight(parsed.showDayNight)
      }
    } catch {
      // Ignore invalid local preferences and keep the documented defaults.
    } finally {
      setStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return

    const stored: StoredWorldClock = {
      selectedIds,
      use24Hour,
      sort,
      showDayNight,
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // The clock remains fully usable when storage is unavailable.
    }
  }, [selectedIds, showDayNight, sort, storageReady, use24Hour])

  useEffect(() => {
    if (selectedIds.includes(activeId)) return
    setActiveId(selectedIds[0])
  }, [activeId, selectedIds])

  useEffect(() => {
    if (!managerOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setManagerOpen(false)
        queueMicrotask(() => managerButtonRef.current?.focus())
      }
    }

    document.addEventListener('keydown', onKeyDown)
    queueMicrotask(() => searchInputRef.current?.focus())
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [managerOpen])

  const selectedCities = useMemo(
    () =>
      selectedIds
        .map((id) => CITIES.find((city) => city.id === id))
        .filter((city): city is (typeof CITIES)[number] => Boolean(city)),
    [selectedIds],
  )

  const displayedCities = useMemo(() => {
    if (sort === 'custom') return selectedCities

    return [...selectedCities].sort((a, b) => {
      if (sort === 'name') {
        return getCityName(a, locale).localeCompare(getCityName(b, locale), locale)
      }
      if (!now) return 0
      return getTimeZoneOffsetMinutes(now, a.timeZone) - getTimeZoneOffsetMinutes(now, b.timeZone)
    })
  }, [locale, now, selectedCities, sort])

  const filteredCities = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return CITIES
    return CITIES.filter((city) => getCitySearchText(city).includes(query))
  }, [search])

  const toggleCity = (id: string) => {
    if (!selectedIds.includes(id)) setActiveId(id)
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.length === 1 ? current : current.filter((cityId) => cityId !== id)
      }
      return [...current, id]
    })
  }

  const closeManager = () => {
    setManagerOpen(false)
    setSearch('')
    queueMicrotask(() => managerButtonRef.current?.focus())
  }

  const toggleClass =
    'min-w-12 rounded-full border border-border/70 px-3 py-1 text-[12px] transition-colors'

  if (!now) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center sm:min-h-[calc(100dvh-4rem)]">
        <span className="text-sm text-muted-foreground">{t('loading')}</span>
      </div>
    )
  }

  const formatDifference = (hours: number) => {
    if (hours === 0) return t('localTime')
    const value = new Intl.NumberFormat(toIntlLocale(locale), {
      maximumFractionDigits: 1,
    }).format(Math.abs(hours))
    return hours > 0 ? t('ahead', { hours: value }) : t('behind', { hours: value })
  }

  return (
    <ToolStage
      locale={locale}
      className={cn(
        'min-h-0 overflow-hidden',
        /* 平板/桌面：地图+城市卡占满首屏；移动端保持内容自适应 */
        'sm:h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-4rem)]',
        'data-[fullscreen=true]:h-dvh data-[fullscreen=true]:min-h-dvh',
      )}
      actions={
        <button
          ref={managerButtonRef}
          type="button"
          onClick={() => setManagerOpen((open) => !open)}
          aria-expanded={managerOpen}
          className={cn(
            'flex min-h-9 items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-[12px] transition-colors',
            managerOpen
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/80 text-muted-foreground hover:text-foreground',
          )}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {t('manageCities')}
        </button>
      }
      settings={
        <>
          <SettingsRow label={t('settings.timeFormat')}>
            <button
              type="button"
              onClick={() => setUse24Hour((value) => !value)}
              className={cn(toggleClass, 'bg-secondary/60 text-foreground')}
            >
              {use24Hour ? t('settings.twentyFourHour') : t('settings.twelveHour')}
            </button>
          </SettingsRow>
          <SettingsRow label={t('settings.citySort')}>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as CitySort)}
              className="min-h-8 rounded-lg border border-border/70 bg-secondary/60 px-2 text-[12px] text-foreground"
            >
              <option value="custom">{t('settings.customOrder')}</option>
              <option value="name">{t('settings.cityName')}</option>
              <option value="offset">{t('settings.utcOffset')}</option>
            </select>
          </SettingsRow>
          <SettingsRow label={t('settings.dayNightLayer')}>
            <button
              type="button"
              onClick={() => setShowDayNight((value) => !value)}
              aria-pressed={showDayNight}
              className={cn(
                toggleClass,
                showDayNight
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-muted-foreground',
              )}
            >
              {showDayNight ? t('settings.on') : t('settings.off')}
            </button>
          </SettingsRow>
          <button
            type="button"
            onClick={() => {
              setUse24Hour(true)
              setSort('custom')
              setShowDayNight(true)
            }}
            className="min-h-9 w-full rounded-lg border border-border/70 bg-secondary/50 px-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('settings.reset')}
          </button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <WorldMap
          now={now}
          cities={displayedCities}
          activeId={activeId}
          onSelect={setActiveId}
          locale={locale}
          showDayNight={showDayNight}
        />

        <div className="shrink-0 py-3 sm:py-4">
          <div className="w-full snap-x snap-mandatory overflow-x-auto pb-1 [scrollbar-width:none] sm:snap-none [&::-webkit-scrollbar]:hidden">
            <h2 className="sr-only">{t('cityTimes')}</h2>
            <ul className="mx-auto flex w-max min-w-full justify-center gap-3 px-4 sm:px-6">
              {displayedCities.map((city) => {
                const zoned = getZonedParts(now, city.timeZone, locale)
                const utcOffset = getTimeZoneOffsetMinutes(now, city.timeZone)
                const relativeOffset = getRelativeOffsetHours(now, city.timeZone)
                const night = zoned.hourNum < 6 || zoned.hourNum >= 19
                const active = city.id === activeId

                return (
                  <li
                    key={city.id}
                    className="w-[152px] shrink-0 snap-center sm:w-[140px] sm:snap-align-none min-[1400px]:w-[156px] min-[1536px]:w-[168px]"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveId(city.id)}
                      aria-pressed={active}
                      className={cn(
                        'flex min-h-[196px] w-full flex-col items-center justify-center rounded-2xl border bg-card px-3 py-3 text-center transition-colors sm:min-h-[180px] lg:min-h-[196px]',
                        active ? 'border-primary/70' : 'border-border/50 hover:border-border',
                      )}
                    >
                      <span className="relative size-24 sm:size-20 min-[1400px]:size-24">
                        <AnalogClock
                          hour={zoned.hourNum}
                          minute={Number(zoned.minute)}
                          second={Number(zoned.second)}
                          night={night}
                        />
                        <span className="sr-only">{night ? t('night') : t('daytime')}</span>
                      </span>

                      <span className="tnum mt-2 text-[17px] font-medium text-foreground">
                        {formatCityTime(now, city.timeZone, locale, use24Hour)}
                      </span>

                      <span className="mt-1 max-w-full truncate text-[11px] text-muted-foreground">
                        {getCountryName(city, locale)} · {getCityName(city, locale)}
                      </span>

                      <span className="mt-2 flex max-w-full items-center justify-center gap-1 text-[10px] text-muted-foreground">
                        <span className="whitespace-nowrap rounded-full bg-secondary/70 px-2 py-0.5">
                          {formatUtcOffset(utcOffset)}
                        </span>
                        <span className="whitespace-nowrap rounded-full bg-secondary/70 px-2 py-0.5">
                          {formatDifference(relativeOffset)}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {managerOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default bg-black/45 sm:absolute"
            aria-label={t('closeManager')}
            onClick={closeManager}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="world-clock-manager-title"
            className={cn(
              'z-40 flex flex-col border border-border/70 bg-popover p-4 shadow-[0_16px_48px_rgba(0,0,0,.4)]',
              /* 手机：固定视口底部 Sheet，避开顶栏与底栏，避免被 ToolStage overflow 裁切 */
              'fixed inset-x-0 bottom-[4.25rem] max-h-[calc(100dvh-3.5rem-4.25rem-0.5rem)] rounded-t-2xl',
              /* 桌面：舞台内右上锚定面板 */
              'sm:absolute sm:inset-x-auto sm:top-16 sm:right-5 sm:bottom-auto sm:max-h-[min(72dvh,38rem)] sm:w-[min(42rem,calc(100vw-2.5rem))] sm:rounded-2xl',
            )}
          >
            <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
              <div>
                <h2 id="world-clock-manager-title" className="text-base font-medium">
                  {t('manager.title')}
                </h2>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {t('manager.selectedCount', { count: selectedIds.length })}
                </p>
              </div>
              <button
                type="button"
                onClick={closeManager}
                aria-label={t('closeManager')}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <label className="relative block shrink-0">
              <span className="sr-only">{t('manager.searchLabel')}</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('manager.searchPlaceholder')}
                className="min-h-11 w-full rounded-xl border border-border/70 bg-secondary/60 pr-3 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </label>

            {filteredCities.length ? (
              <ul className="-mr-4 mt-4 grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto overscroll-contain pr-4 [scrollbar-gutter:stable] sm:grid-cols-2">
                {filteredCities.map((city) => {
                  const selected = selectedIds.includes(city.id)
                  const onlySelectedCity = selected && selectedIds.length === 1
                  return (
                    <li key={city.id}>
                      <button
                        type="button"
                        onClick={() => toggleCity(city.id)}
                        aria-pressed={selected}
                        disabled={onlySelectedCity}
                        className={cn(
                          'flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                          selected
                            ? 'border-primary/40 bg-primary/10 text-foreground'
                            : 'border-border/50 bg-secondary/40 text-muted-foreground hover:border-border hover:text-foreground',
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">
                            {getCityName(city, locale)}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {getCountryName(city, locale)} · {city.timeZone}
                          </span>
                        </span>
                        {selected ? <Check className="size-4 shrink-0 text-primary" aria-hidden="true" /> : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t('manager.noResults')}
              </p>
            )}
          </div>
        </>
      ) : null}
    </ToolStage>
  )
}
