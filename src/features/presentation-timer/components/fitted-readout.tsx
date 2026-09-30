'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export function FittedReadout({
  text,
  color,
  flash,
  fill = 0.45,
}: {
  text: string
  color: string
  flash: boolean
  fill?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState<number | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return

    const update = () => {
      const height = container.clientHeight
      const width = container.clientWidth
      if (height <= 0 || width <= 0) return
      const previous = textEl.style.fontSize
      let size = height * fill
      textEl.style.fontSize = `${size}px`
      const textWidth = textEl.scrollWidth
      if (textWidth > width * 0.8) size *= (width * 0.8) / textWidth
      textEl.style.fontSize = previous
      setFontSize(size)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [fill, text])

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div
        ref={textRef}
        className={cn(
          'font-countdown tnum font-normal leading-none tracking-[-0.045em] whitespace-nowrap',
          flash && 'presentation-readout-flash',
        )}
        style={{ color, fontSize: fontSize ? `${fontSize}px` : 'clamp(4.5rem, 12vw, 8rem)' }}
      >
        {text}
      </div>
    </div>
  )
}
