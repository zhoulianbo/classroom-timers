import type { AgendaItem, PresentationTemplateKey } from '../types'

type TemplateItem = Omit<AgendaItem, 'id' | 'title'> & { titleKey: string }

export const presentationTemplates: Record<PresentationTemplateKey, TemplateItem[]> = {
  blank: [{ titleKey: 'presentation', durationSec: 600 }],
  presentationQa: [
    { titleKey: 'presentation', durationSec: 600 },
    { titleKey: 'questions', durationSec: 180 },
  ],
  studentPresentation: [
    { titleKey: 'opening', durationSec: 120 },
    { titleKey: 'studentPresentation', durationSec: 480 },
    { titleKey: 'questions', durationSec: 180 },
    { titleKey: 'teacherFeedback', durationSec: 120 },
  ],
  trainingSession: [
    { titleKey: 'welcome', durationSec: 300 },
    { titleKey: 'training', durationSec: 1_800 },
    { titleKey: 'break', durationSec: 600 },
    { titleKey: 'questions', durationSec: 600 },
  ],
}

export const presentationTemplateKeys = Object.keys(
  presentationTemplates,
) as PresentationTemplateKey[]
