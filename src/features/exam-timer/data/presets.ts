import type { ExamPreset } from '../types'

export const examPresets: ExamPreset[] = [
  {
    key: 'sat',
    sections: [
      { nameKey: 'criticalReading', minutes: 65 },
      { nameKey: 'writing', minutes: 35 },
      { nameKey: 'math', minutes: 80 },
    ],
  },
  {
    key: 'gre',
    sections: [
      { nameKey: 'verbal', minutes: 30 },
      { nameKey: 'quant', minutes: 35 },
      { nameKey: 'verbal', minutes: 30 },
      { nameKey: 'quant', minutes: 35 },
    ],
  },
  {
    key: 'ielts',
    sections: [
      { nameKey: 'reading', minutes: 60 },
      { nameKey: 'writing', minutes: 60 },
    ],
  },
  {
    key: 'custom3x25',
    sections: [
      { nameKey: 'default', minutes: 25 },
      { nameKey: 'default', minutes: 25 },
      { nameKey: 'default', minutes: 25 },
    ],
  },
]
