'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/config/i18n'
import { getCityName, type City } from '@/features/world-clock/data/cities'
import { WORLD_LAND_PATH, WORLD_VIEWBOX } from '@/features/world-clock/data/world-land-path'
import { getZonedParts } from '@/features/timer-core/lib/time'
import { cn } from '@/lib/utils'

const { width: W, height: H } = WORLD_VIEWBOX

const LABEL_POSITIONS: Record<string, { dx: number; dy: number; anchor: 'start' | 'end' }> = {
  beijing: { dx: -8, dy: -8, anchor: 'end' },
  tokyo: { dx: 8, dy: 8, anchor: 'start' },
  london: { dx: -8, dy: 8, anchor: 'end' },
  paris: { dx: 8, dy: 14, anchor: 'start' },
  sydney: { dx: -8, dy: -12, anchor: 'end' },
}

/** 经纬度 → 等距圆柱投影下的 SVG 坐标（与预生成路径同投影） */
function project(lon: number, lat: number) {
  const scale = W / (2 * Math.PI)
  return {
    x: W / 2 + (lon * Math.PI / 180) * scale,
    y: H / 2 - (lat * Math.PI / 180) * scale,
  }
}

/** 计算太阳直射点，生成昼夜分界线（晨昏线） */
function useTerminator(now: Date) {
  return useMemo(() => {
    const ms = now.getTime()
    const dayMs = 86_400_000
    // 一年中的天数，用于估算太阳赤纬
    const start = Date.UTC(now.getUTCFullYear(), 0, 1)
    const dayOfYear = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start) / dayMs)
    const declination =
      -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10)) * (Math.PI / 180)

    // 太阳当前直射经度（UTC 正午在 0 度）
    const utcHours =
      now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600
    const sunLon = -((utcHours - 12) * 15)

    // 晨昏线：太阳高度角 = 0 的点集
    const points: string[] = []
    for (let i = 0; i <= 360; i += 2) {
      const lon = -180 + i
      const hourAngle = ((lon - sunLon) * Math.PI) / 180
      const tanLat = -Math.cos(hourAngle) / Math.tan(declination)
      const lat = (Math.atan(tanLat) * 180) / Math.PI
      const p = project(lon, Math.max(-85, Math.min(85, lat)))
      points.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    }

    // 夜半球填充：沿晨昏线后经「永夜」一极闭合
    // 北半球夏（δ>0）南极为夜 → closeY=H；冬则北极为夜 → closeY=0
    const northernSummer = declination > 0
    const closeY = northernSummer ? H : 0
    const nightPath = `M ${points.join(' L ')} L ${W},${closeY} L 0,${closeY} Z`

    return { line: `M ${points.join(' L ')}`, night: nightPath, ms }
  }, [now])
}

type WorldMapProps = {
  now: Date
  cities: City[]
  activeId?: string
  onSelect?: (id: string) => void
  locale: Locale
  showDayNight?: boolean
}

export function WorldMap({
  now,
  cities,
  activeId,
  onSelect,
  locale,
  showDayNight = true,
}: WorldMapProps) {
  const t = useTranslations('worldClock.tool')
  const terminator = useTerminator(now)

  return (
    <div className="flex h-[clamp(13rem,62vw,17rem)] w-full shrink-0 items-center justify-center overflow-hidden border-b border-border/50 bg-card/20 sm:h-auto sm:min-h-0 sm:flex-1 sm:max-h-none">
      <svg
        viewBox={`0 ${H * 0.02} ${W} ${H * 0.9}`}
        /* cover：铺满容器宽高，宽屏裁切上下极地，避免左右留黑边 */
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="img"
        aria-label={t('mapAria')}
      >
        {/* 经线网格 */}
        <g className="text-border" aria-hidden="true">
          {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => {
            const x = project(lon, 0).x
            return (
              <line
                key={lon}
                x1={x}
                y1={0}
                x2={x}
                y2={H}
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.5"
              />
            )
          })}
        </g>

        {/* 陆地 */}
        <path d={WORLD_LAND_PATH} className="fill-muted-foreground/45" aria-hidden="true" />

        {/* 夜半球遮罩 */}
        {showDayNight ? (
          <>
            <path d={terminator.night} className="fill-background/55" aria-hidden="true" />
            <path
              d={terminator.line}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-foreground/50"
              aria-hidden="true"
            />
          </>
        ) : null}

        {/* 城市标记 */}
        {cities.map((city) => {
          const p = project(city.lon, city.lat)
          const zoned = getZonedParts(now, city.timeZone, locale)
          const active = city.id === activeId
          const flip = p.x > W - 130
          const labelPosition = LABEL_POSITIONS[city.id] ?? {
            dx: flip ? -7 : 7,
            dy: -2,
            anchor: flip ? ('end' as const) : ('start' as const),
          }
          return (
            <g
              key={city.id}
              onClick={() => onSelect?.(city.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect?.(city.id)
                }
              }}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={
                onSelect
                  ? t('focusCity', { city: getCityName(city, locale) })
                  : undefined
              }
              className={cn(onSelect && 'cursor-pointer')}
            >
              {active ? (
                <g className="world-map-active-marker" aria-hidden="true">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={11}
                    className="world-map-pulse-ring world-map-pulse-ring--outer fill-primary/20"
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={7}
                    className="world-map-pulse-ring world-map-pulse-ring--inner fill-primary/35"
                  />
                  <circle cx={p.x} cy={p.y} r={5} className="fill-primary" />
                  <circle cx={p.x} cy={p.y} r={1.8} className="fill-foreground" />
                </g>
              ) : (
                <circle cx={p.x} cy={p.y} r={3} className="fill-primary" aria-hidden="true" />
              )}
              <text
                x={p.x + labelPosition.dx}
                y={p.y + labelPosition.dy}
                textAnchor={labelPosition.anchor}
                className={cn(
                  'text-[11px] font-medium',
                  active ? 'fill-foreground' : 'fill-foreground/85',
                )}
              >
                {getCityName(city, locale)}
              </text>
              <text
                x={p.x + labelPosition.dx}
                y={p.y + labelPosition.dy + 11}
                textAnchor={labelPosition.anchor}
                className={cn(
                  'tnum text-[10px]',
                  active ? 'fill-primary font-semibold' : 'fill-primary',
                )}
              >
                {zoned.hour}:{zoned.minute}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
