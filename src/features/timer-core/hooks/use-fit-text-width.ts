'use client'

import { useLayoutEffect, useState, type RefObject } from 'react'

type FitTextOptions = {
  /** 目标宽度占容器比例，默认 0.8 */
  widthRatio?: number
  /** 可选：字号上限为容器高度 × 该比例 */
  heightRatio?: number
  /** 测量用参考文字（显示仍为 text），用于跨格式保持字号一致 */
  measureText?: string
}

/**
 * 二分搜索字号，使文字在容器内自适应（首页倒计时同款逻辑）。
 */
export function useFitTextWidth(
  text: string,
  containerRef: RefObject<HTMLElement | null>,
  textRef: RefObject<HTMLElement | null>,
  options: FitTextOptions = {},
) {
  const { widthRatio = 0.8, heightRatio, measureText } = options
  const sizingText = measureText ?? text
  const [fontSizePx, setFontSizePx] = useState<number | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return

    const update = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (width <= 0) return

      const targetWidth = width * widthRatio
      const maxByHeight = heightRatio && height > 0 ? height * heightRatio : Infinity
      const previous = {
        fontSize: textEl.style.fontSize,
        display: textEl.style.display,
        width: textEl.style.width,
        textContent: textEl.textContent,
      }
      textEl.style.display = 'inline-block'
      textEl.style.width = 'auto'
      textEl.textContent = sizingText

      let lo = 12
      let hi = heightRatio && height > 0
        ? Math.max((height * heightRatio) / 0.95, 12)
        : Math.max(width * 0.75, 12)

      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2
        textEl.style.fontSize = `${mid}px`
        const tooWide = textEl.scrollWidth > targetWidth
        const tooTall = textEl.scrollHeight > maxByHeight
        if (tooWide || tooTall) hi = mid
        else lo = mid
      }

      textEl.style.fontSize = previous.fontSize
      textEl.style.display = previous.display
      textEl.style.width = previous.width
      textEl.textContent = previous.textContent
      setFontSizePx(lo)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(container)
    return () => ro.disconnect()
  }, [heightRatio, sizingText, text, widthRatio, containerRef, textRef])

  return fontSizePx
}
