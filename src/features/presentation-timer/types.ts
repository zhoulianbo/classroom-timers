export type PresentationRole = 'host' | 'remote' | 'display'

export type PresentationTimerStatus = 'ready' | 'running' | 'paused' | 'overtime'

export type PresentationPhase = 'green' | 'yellow' | 'red' | 'overtime'

export type PresentationAppearance = 'dark' | 'light'

export type AgendaItem = {
  id: string
  title: string
  durationSec: number
  warningSec?: number
  criticalSec?: number
}

export type PresentationRoom = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  expiresAt: number
  agenda: AgendaItem[]
  activeIndex: number
  timer: {
    status: PresentationTimerStatus
    startedAt?: number
    endsAt?: number
    pausedRemainingMs?: number
    overtimeStartedAt?: number
  }
  settings: {
    endSound: 'off' | 'chime' | 'bell'
    showNextItem: boolean
    quickAdjustSec: number
    appearance: PresentationAppearance
    flash: boolean
    countdownHidden: boolean
    showClock: boolean
  }
  revision: number
  tokens: {
    hostHash: string
    remoteHash: string
    displayHash: string
  }
}

export type PublicPresentationRoom = Omit<PresentationRoom, 'tokens'>

export type PresentationRoomSnapshot = {
  room: PublicPresentationRoom
  role: PresentationRole
  serverNow: number
  connectedCount: number
}

export type PresentationRoomTokens = {
  hostToken: string
  remoteToken: string
  displayToken: string
}

export type LocalPresentationRoom = PresentationRoomTokens & {
  roomId: string
  roomName: string
  lastOpenedAt: number
  expiresAt: number
  agendaSnapshot: AgendaItem[]
}

export type PresentationAction =
  | { type: 'start' | 'pause' | 'reset' | 'next' | 'previous' }
  | { type: 'adjust'; deltaMs: number }
  | { type: 'select'; index: number }
  | {
      type: 'output'
      appearance?: PresentationAppearance
      flash?: boolean
      countdownHidden?: boolean
      showClock?: boolean
    }

export type PresentationTemplateKey =
  | 'blank'
  | 'presentationQa'
  | 'studentPresentation'
  | 'trainingSession'
