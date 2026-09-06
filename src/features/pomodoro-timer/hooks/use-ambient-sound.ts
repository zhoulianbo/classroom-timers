'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export const AMBIENT_SOUNDS = ['none', 'rain', 'birds', 'ocean'] as const
export type AmbientSound = (typeof AMBIENT_SOUNDS)[number]

export const AMBIENT_VIDEO_IDS: Record<Exclude<AmbientSound, 'none'>, string> = {
  rain: 'mPZkdNFkNps',
  birds: 'rYoZgpAEkFs',
  ocean: 'bn9F19Hi1Lk',
}

type YouTubePlayer = {
  loadVideoById: (id: string) => void
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  setVolume: (volume: number) => void
  destroy: () => void
}

type YouTubeApi = {
  Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayer
  PlayerState: { ENDED: number }
}

declare global {
  interface Window {
    YT?: YouTubeApi
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeApi: Promise<YouTubeApi> | null = null

function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('youtube'))
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (youtubeApi) return youtubeApi

  youtubeApi = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      if (window.YT?.Player) resolve(window.YT)
      else reject(new Error('youtube'))
    }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.onerror = () => reject(new Error('youtube'))
      document.head.appendChild(script)
    }
  })
  return youtubeApi
}

/** Ambient loops via the YouTube IFrame API; play only after a user gesture. */
export function useAmbientSound(sound: AmbientSound, volume: number, playing: boolean) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const creatingRef = useRef<Promise<YouTubePlayer | null> | null>(null)
  const soundRef = useRef(sound)
  const playingRef = useRef(playing)
  const volumeRef = useRef(volume)
  const videoRef = useRef<string | null>(null)
  const [error, setError] = useState(false)
  soundRef.current = sound
  playingRef.current = playing
  volumeRef.current = volume

  const apply = useCallback((player: YouTubePlayer) => {
    const next = soundRef.current
    player.setVolume(Math.round(volumeRef.current * 100))
    if (next === 'none' || !playingRef.current) {
      player.pauseVideo()
      return
    }
    const videoId = AMBIENT_VIDEO_IDS[next]
    if (videoRef.current === videoId) {
      player.playVideo()
      return
    }
    videoRef.current = videoId
    player.loadVideoById(videoId)
    player.playVideo()
  }, [])

  const ensurePlayer = useCallback(async () => {
    if (playerRef.current) return playerRef.current
    if (creatingRef.current) return creatingRef.current

    creatingRef.current = (async () => {
      try {
        const api = await loadYouTubeApi()
        if (playerRef.current) return playerRef.current
        const host = mountRef.current ?? document.createElement('div')
        if (!mountRef.current) {
          host.setAttribute('aria-hidden', 'true')
          host.style.cssText =
            'position:absolute;width:200px;height:112px;left:-9999px;top:0;overflow:hidden;pointer-events:none'
          document.body.appendChild(host)
          mountRef.current = host
        }
        const target = document.createElement('div')
        host.appendChild(target)
        const player = await new Promise<YouTubePlayer>((resolve, reject) => {
          try {
            const instance = new api.Player(target, {
              width: 200,
              height: 112,
              host: 'https://www.youtube-nocookie.com',
              playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                loop: 1,
                modestbranding: 1,
                playsinline: 1,
                rel: 0,
                origin: window.location.origin,
              },
              events: {
                onReady: () => resolve(instance),
                onError: () => setError(true),
                onStateChange: (event: { data: number }) => {
                  if (event.data === api.PlayerState.ENDED && playingRef.current && soundRef.current !== 'none') {
                    instance.seekTo(0, true)
                    instance.playVideo()
                  }
                },
              },
            })
          } catch (error) {
            reject(error)
          }
        })
        playerRef.current = player
        setError(false)
        return player
      } catch {
        setError(true)
        return null
      }
    })()

    const player = await creatingRef.current
    creatingRef.current = null
    return player
  }, [])

  const unlock = useCallback(() => {
    void ensurePlayer()
  }, [ensurePlayer])

  useEffect(() => {
    if (sound === 'none' || !playing) {
      playerRef.current?.pauseVideo()
      return
    }
    void ensurePlayer().then((player) => {
      if (player) apply(player)
    })
  }, [apply, ensurePlayer, playing, sound])

  useEffect(() => {
    playerRef.current?.setVolume(Math.round(volume * 100))
  }, [volume])

  useEffect(
    () => () => {
      playerRef.current?.destroy()
      playerRef.current = null
      videoRef.current = null
      mountRef.current?.remove()
      mountRef.current = null
    },
    [],
  )

  return { unlock, error }
}
