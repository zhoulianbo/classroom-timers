type AnalogClockProps = {
  hour: number
  minute: number
  second: number
  /** 是否为夜间（决定表盘配色） */
  night?: boolean
}

const HOUR_LABELS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

export function AnalogClock({ hour, minute, second, night = false }: AnalogClockProps) {
  const hourDeg = ((hour % 12) + minute / 60) * 30
  const minuteDeg = (minute + second / 60) * 6
  const secondDeg = second * 6

  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="48"
        className={night ? 'fill-background' : 'fill-elevated'}
        stroke="currentColor"
        strokeWidth="0.6"
        strokeOpacity="0.25"
      />

      {HOUR_LABELS.map((label, i) => {
        const angle = ((i * 30 - 90) * Math.PI) / 180
        const r = 38
        return (
          <text
            key={label}
            x={50 + r * Math.cos(angle)}
            y={50 + r * Math.sin(angle)}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground/80 text-[9px]"
          >
            {label}
          </text>
        )
      })}

      {/* 昼夜提示放在指针下方，降低透明度避免抢占时间层级 */}
      <g
        transform="translate(41.6 58) scale(0.7)"
        opacity="0.55"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        className={night ? 'text-foreground' : 'text-primary'}
      >
        {night ? (
          <path d="M20.5 13.1A8 8 0 1 1 10.9 3.5a6.2 6.2 0 0 0 9.6 9.6Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="3.6" />
            <path d="M12 2.2v2M12 19.8v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.2 12h2M19.8 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
      </g>

      {/* 时针 */}
      <line
        x1="50"
        y1="54"
        x2="50"
        y2="27"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        className="text-foreground"
        transform={`rotate(${hourDeg} 50 50)`}
      />
      {/* 分针 */}
      <line
        x1="50"
        y1="56"
        x2="50"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-foreground"
        transform={`rotate(${minuteDeg} 50 50)`}
      />
      {/* 秒针 */}
      <line
        x1="50"
        y1="60"
        x2="50"
        y2="12"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        className="text-primary"
        transform={`rotate(${secondDeg} 50 50)`}
      />
      <circle cx="50" cy="50" r="1.8" className="fill-primary" />
    </svg>
  )
}
