import type { ExamPreset } from '../types'

export const examPresets: ExamPreset[] = [
  {
    key: 'sat',
    sections: [
      { nameKey: 'readingWriting', minutes: 32 },
      { nameKey: 'readingWriting', minutes: 32 },
      { nameKey: 'math', minutes: 35 },
      { nameKey: 'math', minutes: 35 },
    ],
  },
  {
    key: 'gre',
    sections: [
      { nameKey: 'analyticalWriting', minutes: 30 },
      { nameKey: 'verbal', minutes: 18 },
      { nameKey: 'verbal', minutes: 23 },
      { nameKey: 'quant', minutes: 21 },
      { nameKey: 'quant', minutes: 26 },
    ],
  },
  {
    key: 'ielts',
    sections: [
      { nameKey: 'listening', minutes: 30 },
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
