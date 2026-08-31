import type { CSSProperties } from 'react'

export const CLOCK_BACKGROUNDS = [
  'black',
  'graphite',
  'warmIvory',
  'softSky',
  'classroomSlate',
] as const

export const CLOCK_BACKGROUND_IMAGES = [
  'none',
  'chalkboard',
  'nightSky',
  'mistyMountains',
  'sunlitClassroom',
  'lightStudy',
  'pastelSky',
  'gridPaper',
  'libraryRoom',
  'copySpace',
  'sunlightWater',
  'woodenSurface',
] as const

export const CLOCK_IMAGE_OPTIONS = CLOCK_BACKGROUND_IMAGES.filter(
  (option) => option !== 'none',
)

export type ClockBackground = (typeof CLOCK_BACKGROUNDS)[number]
export type ClockBackgroundImage = (typeof CLOCK_BACKGROUND_IMAGES)[number]

export const CLOCK_BACKGROUND_STYLES: Record<
  ClockBackground,
  { stage: string; muted: string; swatch: string; color: string }
> = {
  black: {
    stage: 'bg-[#0B0B0C] text-[#F5F5F7]',
    muted: 'text-white/60',
    swatch: 'bg-[#0B0B0C]',
    color: '#0B0B0C',
  },
  graphite: {
    stage: 'bg-[#202124] text-[#F5F5F7]',
    muted: 'text-white/65',
    swatch: 'bg-[#202124]',
    color: '#202124',
  },
  warmIvory: {
    stage: 'bg-[#EEE8DD] text-[#24211C]',
    muted: 'text-[#625C52]',
    swatch: 'bg-[#EEE8DD]',
    color: '#EEE8DD',
  },
  softSky: {
    stage: 'bg-[#DDEAF6] text-[#1D2A36]',
    muted: 'text-[#526678]',
    swatch: 'bg-[#DDEAF6]',
    color: '#DDEAF6',
  },
  classroomSlate: {
    stage: 'bg-[#26303A] text-[#F5F5F7]',
    muted: 'text-[#C0C9D1]',
    swatch: 'bg-[#26303A]',
    color: '#26303A',
  },
}

type StageBackgroundImage = {
  src?: string
  fallback: string
  position: string
  overlay?: string
  tone: 'light' | 'dark'
}

export const CLOCK_BACKGROUND_IMAGE_STYLES: Record<
  ClockBackgroundImage,
  StageBackgroundImage
> = {
  none: {
    fallback: '#202124',
    position: 'center',
    tone: 'dark',
  },
  chalkboard: {
    src: '/bg/background-chalkboard.webp',
    fallback: '#26332F',
    position: 'center',
    overlay: 'linear-gradient(rgba(5, 7, 10, 0.26), rgba(5, 7, 10, 0.42))',
    tone: 'dark',
  },
  nightSky: {
    src: '/bg/background-night-sky.webp',
    fallback: '#101827',
    position: 'center',
    overlay: 'linear-gradient(rgba(5, 7, 10, 0.28), rgba(5, 7, 10, 0.46))',
    tone: 'dark',
  },
  mistyMountains: {
    src: '/bg/background-misty-mountains.webp',
    fallback: '#35424A',
    position: 'center',
    overlay: 'linear-gradient(rgba(15, 22, 28, 0.24), rgba(15, 22, 28, 0.4))',
    tone: 'dark',
  },
  sunlitClassroom: {
    src: '/bg/background-sunlit-classroom.webp',
    fallback: '#E8DFD1',
    position: 'center',
    overlay: 'linear-gradient(rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.56))',
    tone: 'light',
  },
  lightStudy: {
    src: '/bg/background-light-study.webp',
    fallback: '#E8E2D9',
    position: 'center',
    overlay: 'linear-gradient(rgba(255, 255, 255, 0.44), rgba(255, 255, 255, 0.58))',
    tone: 'light',
  },
  pastelSky: {
    src: '/bg/background-pastel-sky.webp',
    fallback: '#DDEAF6',
    position: 'center',
    overlay: 'linear-gradient(rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.48))',
    tone: 'light',
  },
  gridPaper: {
    src: '/bg/background-grid-paper.webp',
    fallback: '#F2F1EC',
    position: 'center',
    overlay: 'linear-gradient(rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.36))',
    tone: 'light',
  },
  libraryRoom: {
    src: '/bg/background-library-room.webp',
    fallback: '#E4DDD1',
    position: 'center',
    overlay: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.62))',
    tone: 'light',
  },
  copySpace: {
    src: '/bg/background-copy-space.webp',
    fallback: '#E9E5DD',
    position: 'center',
    overlay: 'linear-gradient(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.42))',
    tone: 'light',
  },
  sunlightWater: {
    src: '/bg/background-sunlight-water.webp',
    fallback: '#DCEAF0',
    position: 'center',
    overlay: 'linear-gradient(rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.5))',
    tone: 'light',
  },
  woodenSurface: {
    src: '/bg/background-wooden-surface.webp',
    fallback: '#DED1C0',
    position: 'center',
    overlay: 'linear-gradient(rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.5))',
    tone: 'light',
  },
}

export function getStageBackgroundStyle(
  option: ClockBackgroundImage,
): CSSProperties | undefined {
  const background = CLOCK_BACKGROUND_IMAGE_STYLES[option]
  if (!background.src) return undefined

  return {
    backgroundColor: background.fallback,
    backgroundImage: background.overlay
      ? `${background.overlay}, url('${background.src}')`
      : `url('${background.src}')`,
    backgroundPosition: background.position,
    backgroundSize: 'cover',
  }
}

export function getStageBackgroundPreviewStyle(
  option: ClockBackgroundImage,
): CSSProperties {
  const background = CLOCK_BACKGROUND_IMAGE_STYLES[option]

  return {
    backgroundColor: background.fallback,
    backgroundImage:
      background.src && background.overlay
        ? `${background.overlay}, url('${background.src}')`
        : background.src
          ? `url('${background.src}')`
          : undefined,
    backgroundPosition: background.position,
    backgroundSize: 'cover',
  }
}
