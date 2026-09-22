export const classroomTimerPresets = [
  { slug: '1-minute-timer', minutes: 1, labelKey: 'quietTransition' },
  { slug: '2-minute-timer', minutes: 2, labelKey: 'tidyUp' },
  { slug: '3-minute-timer', minutes: 3, labelKey: 'groupRotation' },
  { slug: '5-minute-timer', minutes: 5, labelKey: 'presentation' },
  { slug: '10-minute-timer', minutes: 10, labelKey: 'groupWork' },
  { slug: '15-minute-timer', minutes: 15, labelKey: 'transition' },
  { slug: '20-minute-timer', minutes: 20, labelKey: 'miniLesson' },
  { slug: '25-minute-timer', minutes: 25, labelKey: 'focusSession' },
  { slug: '30-minute-timer', minutes: 30, labelKey: 'lessonBlock' },
  { slug: '45-minute-timer', minutes: 45, labelKey: 'classActivity' },
  { slug: '60-minute-timer', minutes: 60, labelKey: 'exam' },
] as const

export type ClassroomTimerPreset = (typeof classroomTimerPresets)[number]

export function getClassroomTimerPreset(slug: string) {
  return classroomTimerPresets.find((preset) => preset.slug === slug)
}
