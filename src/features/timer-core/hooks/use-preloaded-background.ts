'use client'

import { useEffect, useState } from 'react'
import {
  CLOCK_BACKGROUND_IMAGE_STYLES,
  type ClockBackgroundImage,
} from '@/features/timer-core/data/stage-backgrounds'

export function usePreloadedBackground(requested: ClockBackgroundImage) {
  const [active, setActive] = useState<ClockBackgroundImage>('none')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (requested === 'none') {
      setActive('none')
      setLoading(false)
      return
    }

    const source = CLOCK_BACKGROUND_IMAGE_STYLES[requested].src
    if (!source || active === requested) {
      setLoading(false)
      return
    }

    let cancelled = false
    const image = new Image()
    setLoading(true)

    const commit = () => {
      if (cancelled) return
      setActive(requested)
      setLoading(false)
    }

    image.onload = () => {
      if (typeof image.decode === 'function') {
        image.decode().then(commit).catch(commit)
      } else {
        commit()
      }
    }
    image.onerror = commit
    image.src = source

    return () => {
      cancelled = true
    }
  }, [active, requested])

  return { active, loading }
}
